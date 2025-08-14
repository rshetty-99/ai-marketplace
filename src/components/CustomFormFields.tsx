import { E164Number } from "libphonenumber-js/core";
import Image from "next/image";
import ReactDatePicker from "react-datepicker";
import { Control,ControllerRenderProps, FieldValues, Path } from "react-hook-form";
import PhoneInput from "react-phone-number-input";
import "react-datepicker/dist/react-datepicker.css";
import "react-phone-number-input/style.css";

import { Checkbox } from "./ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import React from "react";

export enum FormFieldType {
  INPUT = "input",
  TEXTAREA = "textarea",
  PHONE_INPUT = "phoneInput",
  CHECKBOX = "checkbox",
  DATE_PICKER = "datePicker",
  SELECT = "select",
  SKELETON = "skeleton",
}

interface CustomProps <T extends FieldValues = FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  iconSrc?: string;
  iconAlt?: string;
  disabled?: boolean;
  dateFormat?: string;
  showTimeSelect?: boolean;
  children?: React.ReactNode;
  renderSkeleton?: (field: ControllerRenderProps<T, Path<T>>) => React.ReactNode;
  fieldType: FormFieldType;
}

// Usage:
// // Example usage with a typed form
// interface MyFormValues {
//   firstName: string;
//   email: string;
//   birthDate: Date;
// }

// // The component will now only accept valid form field names
// <CustomFormField<MyFormValues>
//   name="firstName"  // This must match a key in MyFormValues
//   control={control}
//   fieldType={FormFieldType.INPUT}
// />

const RenderInput = <T extends FieldValues>({ 
  field, 
  props 
}: { 
  field: ControllerRenderProps<T, Path<T>>;
  props: CustomProps<T>;
}) => {
  switch (props.fieldType) {
    case FormFieldType.INPUT:
      return (
        <div className="flex rounded-md border border-input bg-background">
          {props.iconSrc && (
            <div className="flex items-center justify-center px-3">
              <Image
                src={props.iconSrc}
                height={24}
                width={24}
                alt={props.iconAlt || "icon"}
              />
            </div>
          )}
          <FormControl>
            <Input
              placeholder={props.placeholder}
              {...field}
              className="border-0 focus-visible:ring-0"
              disabled={props.disabled}
            />
          </FormControl>
        </div>
      );

    case FormFieldType.TEXTAREA:
      return (
        <FormControl>
          <Textarea
            placeholder={props.placeholder}
            {...field}
            className="min-h-[100px] resize-none"
            disabled={props.disabled}
          />
        </FormControl>
      );

    case FormFieldType.PHONE_INPUT:
      return (
        <FormControl>
          <PhoneInput
            defaultCountry="US"
            placeholder={props.placeholder}
            international
            withCountryCallingCode
            value={field.value as E164Number | undefined}
            onChange={field.onChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          />
        </FormControl>
      );

    case FormFieldType.CHECKBOX:
      return (
        <FormControl>
          <div className="flex items-center space-x-2">
            <Checkbox
              id={props.name}
              checked={field.value}
              onCheckedChange={field.onChange}
            />
            <label
              htmlFor={props.name}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {props.label}
            </label>
          </div>
        </FormControl>
      );

    case FormFieldType.DATE_PICKER:
      return (
        <div className="flex rounded-md border border-input bg-background">
          {props.iconSrc && (
            <div className="flex items-center justify-center px-3">
              <Image
                src={props.iconSrc}
                height={24}
                width={24}
                alt={props.iconAlt || "calendar"}
              />
            </div>
          )}
          <FormControl>
            <ReactDatePicker
              showTimeSelect={props.showTimeSelect ?? false}
              selected={field.value}
              onChange={(date: Date | null) => {
                if (date) {
                  field.onChange(date);
                }
              }}
              timeInputLabel="Time:"
              dateFormat={props.dateFormat ?? "MM/dd/yyyy"}
              className="flex h-10 w-full rounded-md bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
          </FormControl>
        </div>
      );

    case FormFieldType.SELECT:
      return (
        <FormControl>
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value || undefined}
          >
            <SelectTrigger>
              <SelectValue placeholder={props.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {React.Children.map(props.children, (child) => {
                if (React.isValidElement(child) && child.type === "option") {
                  return (
                    <SelectItem
                      key={child.props.value}
                      value={child.props.value || "default"}
                    >
                      {child.props.children}
                    </SelectItem>
                  );
                }
                return child;
              })}
            </SelectContent>
          </Select>
        </FormControl>
      );

    case FormFieldType.SKELETON:
      return props.renderSkeleton ? props.renderSkeleton(field) : null;

    default:
      return null;
  }
};

const CustomFormField = <T extends FieldValues>(props: CustomProps<T>) => {
  const { control, name, label } = props;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex w-full flex-col gap-1.5">
          {props.fieldType !== FormFieldType.CHECKBOX && label && (
            <FormLabel>{label}</FormLabel>
          )}
          <RenderInput field={field} props={props} />
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default CustomFormField;
