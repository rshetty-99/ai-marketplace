import { Metadata } from 'next';
import { ProfileClient } from './profile-client';

export const metadata: Metadata = {
  title: 'Profile | AI Marketplace',
  description: 'Manage your profile settings and information',
};

export default function ProfilePage() {
  return <ProfileClient />;
}