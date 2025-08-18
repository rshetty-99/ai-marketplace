import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, getDoc, setDoc, updateDoc, query, where, orderBy, limit as firestoreLimit, startAfter, writeBatch } from 'firebase/firestore';
import { EmbeddingService, getEmbeddingService } from './embedding-service';
import { ContentExtractor, PerformanceMonitor } from './utils';
import type { ServiceEmbedding, EmbeddingGenerationJob } from '@/types/semantic-search';

interface PipelineConfig {
  batchSize: number;
  maxConcurrentBatches: number;
  retryAttempts: number;
  enableProgressTracking: boolean;
  dryRun: boolean;
}

interface PipelineProgress {
  totalServices: number;
  processedServices: number;
  successfulEmbeddings: number;
  failedEmbeddings: number;
  skippedServices: number;
  currentBatch: number;
  totalBatches: number;
  startTime: Date;
  estimatedCompletion?: Date;
  errors: Array<{
    serviceId: string;
    error: string;
    timestamp: Date;
  }>;
}

interface PipelineStats {
  totalCost: number;
  totalTokens: number;
  averageTokensPerService: number;
  averageProcessingTime: number;
  throughput: number; // services per minute
}

export class EmbeddingPipeline {
  private db: any;
  private embeddingService: EmbeddingService;
  private config: PipelineConfig;
  private progress: PipelineProgress;
  private stats: PipelineStats;
  private isRunning: boolean = false;
  private shouldStop: boolean = false;

  constructor(
    firebaseConfig: any,
    pipelineConfig: Partial<PipelineConfig> = {}
  ) {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    this.db = getFirestore(app);
    
    // Initialize embedding service
    this.embeddingService = getEmbeddingService();
    
    // Set configuration with defaults
    this.config = {
      batchSize: 10,
      maxConcurrentBatches: 2,
      retryAttempts: 3,
      enableProgressTracking: true,
      dryRun: false,
      ...pipelineConfig,
    };
    
    // Initialize progress tracking
    this.progress = this.initializeProgress();
    this.stats = this.initializeStats();
  }

  /**
   * Process all services and generate embeddings
   */
  async processAllServices(): Promise<PipelineProgress> {
    if (this.isRunning) {
      throw new Error('Pipeline is already running');
    }

    this.isRunning = true;
    this.shouldStop = false;
    this.progress = this.initializeProgress();
    this.stats = this.initializeStats();

    const timer = PerformanceMonitor.startTimer();

    try {
      console.log('🚀 Starting embedding generation pipeline...');
      
      // Get total service count
      const totalCount = await this.getTotalServiceCount();
      this.progress.totalServices = totalCount;
      
      console.log(`📊 Found ${totalCount} services to process`);
      
      if (totalCount === 0) {
        console.log('✅ No services to process');
        return this.progress;
      }

      // Calculate batches
      this.progress.totalBatches = Math.ceil(totalCount / this.config.batchSize);
      
      // Process services in batches
      await this.processBatches();
      
      // Calculate final stats
      const totalTime = timer();
      this.stats.throughput = (this.progress.processedServices / totalTime) * 60000; // per minute
      
      console.log('🎉 Pipeline completed successfully!');
      this.logFinalStats();
      
    } catch (error) {
      console.error('❌ Pipeline failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }

    return this.progress;
  }

  /**
   * Process specific services by IDs
   */
  async processServicesById(serviceIds: string[]): Promise<PipelineProgress> {
    if (this.isRunning) {
      throw new Error('Pipeline is already running');
    }

    this.isRunning = true;
    this.shouldStop = false;
    this.progress = this.initializeProgress();
    this.progress.totalServices = serviceIds.length;

    try {
      console.log(`🎯 Processing ${serviceIds.length} specific services...`);
      
      // Split into batches
      const batches = this.chunkArray(serviceIds, this.config.batchSize);
      this.progress.totalBatches = batches.length;
      
      for (let i = 0; i < batches.length; i++) {
        if (this.shouldStop) break;
        
        const batch = batches[i];
        this.progress.currentBatch = i + 1;
        
        await this.processBatch(batch);
        this.logProgress();
      }
      
      console.log('✅ Specific service processing completed');
      
    } catch (error) {
      console.error('❌ Service processing failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }

    return this.progress;
  }

  /**
   * Update embeddings for services with outdated content
   */
  async updateOutdatedEmbeddings(): Promise<PipelineProgress> {
    if (this.isRunning) {
      throw new Error('Pipeline is already running');
    }

    this.isRunning = true;
    this.shouldStop = false;
    this.progress = this.initializeProgress();

    try {
      console.log('🔄 Finding services with outdated embeddings...');
      
      const outdatedServices = await this.findOutdatedServices();
      this.progress.totalServices = outdatedServices.length;
      
      if (outdatedServices.length === 0) {
        console.log('✅ All embeddings are up to date');
        return this.progress;
      }
      
      console.log(`📊 Found ${outdatedServices.length} services with outdated embeddings`);
      
      // Process outdated services
      const serviceIds = outdatedServices.map(s => s.id);
      await this.processServicesById(serviceIds);
      
    } catch (error) {
      console.error('❌ Outdated embedding update failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }

    return this.progress;
  }

  /**
   * Stop the pipeline gracefully
   */
  stop(): void {
    console.log('🛑 Stopping pipeline...');
    this.shouldStop = true;
  }

  /**
   * Get current progress
   */
  getProgress(): PipelineProgress {
    return { ...this.progress };
  }

  /**
   * Get current stats
   */
  getStats(): PipelineStats {
    return { ...this.stats };
  }

  /**
   * Process services in batches
   */
  private async processBatches(): Promise<void> {
    let lastDoc: any = null;
    let currentBatch = 0;

    while (currentBatch < this.progress.totalBatches && !this.shouldStop) {
      const batchTimer = PerformanceMonitor.startTimer();
      
      try {
        // Get next batch of services
        const services = await this.getServiceBatch(lastDoc);
        
        if (services.length === 0) break;
        
        // Update last document for pagination
        lastDoc = services[services.length - 1];
        
        // Process batch
        this.progress.currentBatch = ++currentBatch;
        const serviceIds = services.map(s => s.id);
        
        await this.processBatch(serviceIds);
        
        const batchTime = batchTimer();
        this.stats.averageProcessingTime = (this.stats.averageProcessingTime * (currentBatch - 1) + batchTime) / currentBatch;
        
        this.logProgress();
        
        // Small delay to avoid overwhelming the API
        if (currentBatch < this.progress.totalBatches) {
          await this.delay(1000);
        }
        
      } catch (error) {
        console.error(`❌ Batch ${currentBatch} failed:`, error);
        // Continue with next batch instead of failing entirely
      }
    }
  }

  /**
   * Process a single batch of service IDs
   */
  private async processBatch(serviceIds: string[]): Promise<void> {
    const batchPromises = serviceIds.map(async (serviceId) => {
      let retryCount = 0;
      
      while (retryCount <= this.config.retryAttempts) {
        try {
          await this.processService(serviceId);
          this.progress.successfulEmbeddings++;
          this.progress.processedServices++;
          break;
          
        } catch (error) {
          retryCount++;
          
          if (retryCount > this.config.retryAttempts) {
            console.error(`❌ Failed to process service ${serviceId} after ${this.config.retryAttempts} retries:`, error);
            
            this.progress.failedEmbeddings++;
            this.progress.processedServices++;
            this.progress.errors.push({
              serviceId,
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date(),
            });
          } else {
            console.warn(`⚠️  Retry ${retryCount} for service ${serviceId}`);
            await this.delay(1000 * retryCount); // Exponential backoff
          }
        }
      }
    });

    // Process batch with concurrency control
    await this.processConcurrently(batchPromises, this.config.maxConcurrentBatches);
  }

  /**
   * Process a single service
   */
  private async processService(serviceId: string): Promise<void> {
    // Get service data
    const serviceDoc = await getDoc(doc(this.db, 'services', serviceId));
    
    if (!serviceDoc.exists()) {
      throw new Error(`Service ${serviceId} not found`);
    }
    
    const serviceData = { id: serviceDoc.id, ...serviceDoc.data() };
    
    // Check if embedding already exists and is up to date
    const existingEmbedding = serviceData.embedding;
    
    if (existingEmbedding && !this.embeddingService.needsRegeneration(serviceData, existingEmbedding)) {
      console.log(`⏭️  Skipping service ${serviceId} (embedding up to date)`);
      this.progress.skippedServices++;
      return;
    }
    
    if (this.config.dryRun) {
      console.log(`🧪 [DRY RUN] Would generate embedding for service ${serviceId}`);
      return;
    }
    
    // Generate embedding
    const serviceEmbedding = await this.embeddingService.generateServiceEmbedding(serviceData);
    
    // Update service document with embedding
    await updateDoc(doc(this.db, 'services', serviceId), {
      embedding: serviceEmbedding.embedding,
      embeddingMetadata: serviceEmbedding.metadata,
      searchContent: serviceEmbedding.searchContent,
      contentSources: serviceEmbedding.contentSources,
      lastEmbeddingUpdate: new Date(),
    });
    
    // Update stats
    this.stats.totalTokens += serviceEmbedding.metadata.tokenCount;
    this.stats.totalCost += this.calculateCost(serviceEmbedding.metadata.tokenCount);
    this.stats.averageTokensPerService = this.stats.totalTokens / this.progress.successfulEmbeddings;
    
    console.log(`✅ Generated embedding for service ${serviceId} (${serviceEmbedding.metadata.tokenCount} tokens)`);
  }

  /**
   * Get total service count
   */
  private async getTotalServiceCount(): Promise<number> {
    const snapshot = await getDocs(collection(this.db, 'services'));
    return snapshot.size;
  }

  /**
   * Get a batch of services
   */
  private async getServiceBatch(lastDoc: any = null): Promise<any[]> {
    let q = query(
      collection(this.db, 'services'),
      orderBy('createdAt', 'desc'),
      firestoreLimit(this.config.batchSize)
    );
    
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Find services with outdated embeddings
   */
  private async findOutdatedServices(): Promise<any[]> {
    const snapshot = await getDocs(collection(this.db, 'services'));
    const outdatedServices: any[] = [];
    
    for (const doc of snapshot.docs) {
      const serviceData = { id: doc.id, ...doc.data() };
      const existingEmbedding = serviceData.embedding;
      
      if (!existingEmbedding || this.embeddingService.needsRegeneration(serviceData, existingEmbedding)) {
        outdatedServices.push(serviceData);
      }
    }
    
    return outdatedServices;
  }

  /**
   * Process promises with concurrency control
   */
  private async processConcurrently<T>(
    promises: Promise<T>[],
    concurrency: number
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < promises.length; i += concurrency) {
      const batch = promises.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(batch);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results[i + index] = result.value;
        }
      });
    }
    
    return results;
  }

  /**
   * Calculate embedding cost
   */
  private calculateCost(tokenCount: number): number {
    // Using text-embedding-3-small pricing
    return (tokenCount * 0.00002) / 1000;
  }

  /**
   * Initialize progress tracking
   */
  private initializeProgress(): PipelineProgress {
    return {
      totalServices: 0,
      processedServices: 0,
      successfulEmbeddings: 0,
      failedEmbeddings: 0,
      skippedServices: 0,
      currentBatch: 0,
      totalBatches: 0,
      startTime: new Date(),
      errors: [],
    };
  }

  /**
   * Initialize stats
   */
  private initializeStats(): PipelineStats {
    return {
      totalCost: 0,
      totalTokens: 0,
      averageTokensPerService: 0,
      averageProcessingTime: 0,
      throughput: 0,
    };
  }

  /**
   * Log current progress
   */
  private logProgress(): void {
    if (!this.config.enableProgressTracking) return;
    
    const { totalServices, processedServices, successfulEmbeddings, failedEmbeddings, currentBatch, totalBatches } = this.progress;
    const percentage = totalServices > 0 ? Math.round((processedServices / totalServices) * 100) : 0;
    
    console.log(`📈 Progress: ${percentage}% (${processedServices}/${totalServices}) | Batch: ${currentBatch}/${totalBatches} | Success: ${successfulEmbeddings} | Failed: ${failedEmbeddings}`);
    
    // Estimate completion time
    if (processedServices > 0) {
      const elapsedTime = Date.now() - this.progress.startTime.getTime();
      const remainingServices = totalServices - processedServices;
      const averageTimePerService = elapsedTime / processedServices;
      const estimatedRemainingTime = remainingServices * averageTimePerService;
      
      this.progress.estimatedCompletion = new Date(Date.now() + estimatedRemainingTime);
      
      console.log(`⏰ Estimated completion: ${this.progress.estimatedCompletion.toLocaleTimeString()}`);
    }
  }

  /**
   * Log final statistics
   */
  private logFinalStats(): void {
    console.log('\n📊 Final Statistics:');
    console.log(`├── Total Services: ${this.progress.totalServices}`);
    console.log(`├── Successful: ${this.progress.successfulEmbeddings}`);
    console.log(`├── Failed: ${this.progress.failedEmbeddings}`);
    console.log(`├── Skipped: ${this.progress.skippedServices}`);
    console.log(`├── Total Cost: $${this.stats.totalCost.toFixed(4)}`);
    console.log(`├── Total Tokens: ${this.stats.totalTokens.toLocaleString()}`);
    console.log(`├── Avg Tokens/Service: ${Math.round(this.stats.averageTokensPerService)}`);
    console.log(`├── Throughput: ${Math.round(this.stats.throughput)} services/min`);
    console.log(`└── Duration: ${this.getElapsedTime()}`);
    
    if (this.progress.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.progress.errors.slice(0, 10).forEach(error => {
        console.log(`   └── ${error.serviceId}: ${error.error}`);
      });
      
      if (this.progress.errors.length > 10) {
        console.log(`   └── ... and ${this.progress.errors.length - 10} more errors`);
      }
    }
  }

  /**
   * Get elapsed time in human readable format
   */
  private getElapsedTime(): string {
    const elapsed = Date.now() - this.progress.startTime.getTime();
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; message: string; details?: any }> {
    try {
      // Check Firestore connection
      const testQuery = await getDocs(query(collection(this.db, 'services'), firestoreLimit(1)));
      
      // Check embedding service
      const embeddingHealth = await this.embeddingService.healthCheck();
      
      if (!embeddingHealth.healthy) {
        return embeddingHealth;
      }
      
      return {
        healthy: true,
        message: 'Pipeline is healthy',
        details: {
          firestoreConnected: true,
          embeddingServiceHealthy: true,
          sampleServicesFound: testQuery.size,
          isRunning: this.isRunning,
        },
      };
      
    } catch (error) {
      return {
        healthy: false,
        message: `Pipeline health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error?.toString() },
      };
    }
  }
}

/**
 * Utility function to create and run pipeline
 */
export async function runEmbeddingPipeline(
  firebaseConfig: any,
  options: {
    mode: 'all' | 'specific' | 'outdated';
    serviceIds?: string[];
    config?: Partial<PipelineConfig>;
  }
): Promise<PipelineProgress> {
  const pipeline = new EmbeddingPipeline(firebaseConfig, options.config);
  
  switch (options.mode) {
    case 'all':
      return pipeline.processAllServices();
    case 'specific':
      if (!options.serviceIds || options.serviceIds.length === 0) {
        throw new Error('Service IDs required for specific mode');
      }
      return pipeline.processServicesById(options.serviceIds);
    case 'outdated':
      return pipeline.updateOutdatedEmbeddings();
    default:
      throw new Error(`Unknown pipeline mode: ${options.mode}`);
  }
}

/**
 * CLI-like interface for running pipeline
 */
export class PipelineCLI {
  static async run(args: string[]): Promise<void> {
    const mode = args[0] as 'all' | 'specific' | 'outdated';
    const dryRun = args.includes('--dry-run');
    const batchSize = args.includes('--batch-size') 
      ? parseInt(args[args.indexOf('--batch-size') + 1]) 
      : 10;
    
    if (!mode || !['all', 'specific', 'outdated'].includes(mode)) {
      console.log('Usage: pipeline <all|specific|outdated> [--dry-run] [--batch-size N]');
      return;
    }
    
    try {
      const firebaseConfig = {
        // Add your Firebase config here
        projectId: process.env.FIREBASE_PROJECT_ID,
        // ... other config
      };
      
      const result = await runEmbeddingPipeline(firebaseConfig, {
        mode,
        config: {
          dryRun,
          batchSize,
          enableProgressTracking: true,
        },
      });
      
      console.log('\n🎉 Pipeline completed successfully!');
      process.exit(0);
      
    } catch (error) {
      console.error('❌ Pipeline failed:', error);
      process.exit(1);
    }
  }
}