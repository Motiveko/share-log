import * as React from "react";
import { cn } from "@web/lib/utils";
import { Label } from "./label";
import { Input, type InputProps } from "./input";

export interface FormFieldProps extends InputProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  containerClassName?: string;
}

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  (
    { label, error, hint, required, containerClassName, id, className, ...props },
    ref
  ) => {
    const inputId = id || React.useId();
    const hasError = Boolean(error);

    return (
      <div className={cn("flex flex-col gap-2", containerClassName)}>
        <Label htmlFor={inputId}>
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
        <Input
          ref={ref}
          id={inputId}
          variant={hasError ? "error" : "default"}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          className={className}
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
FormField.displayName = "FormField";

export { FormField };
