import * as React from "react"
import { Controller, ControllerProps, FieldPath, FieldValues, FormProvider, useFormContext } from "react-hook-form"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/utils/cn"
import { GlassLabel } from "../primitives/GlassLabel"

const GlassForm = FormProvider

type GlassFormFieldContextValue<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
    name: TName
}

const FormFieldContext = React.createContext<GlassFormFieldContextValue>(
    {} as GlassFormFieldContextValue
)

const GlassFormField = <
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
    ...props
}: ControllerProps<TFieldValues, TName>) => {
    return (
        <FormFieldContext.Provider value={{ name: props.name }}>
            <Controller {...props} />
        </FormFieldContext.Provider>
    )
}

const useFormField = () => {
    const fieldContext = React.useContext(FormFieldContext)
    const itemContext = React.useContext(FormItemContext)
    const { getFieldState, formState } = useFormContext()

    const fieldState = getFieldState(fieldContext.name, formState)

    if (!fieldContext) {
        throw new Error("useFormField must be used within <GlassFormField>")
    }

    const { id } = itemContext

    return {
        id,
        name: fieldContext.name,
        formItemId: `${id}-form-item`,
        formDescriptionId: `${id}-form-item-description`,
        formMessageId: `${id}-form-item-message`,
        ...fieldState,
    }
}

type GlassFormItemContextValue = {
    id: string
}

const FormItemContext = React.createContext<GlassFormItemContextValue>(
    {} as GlassFormItemContextValue
)

const GlassFormItem = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
    const id = React.useId()

    return (
        <FormItemContext.Provider value={{ id }}>
            <div ref={ref} className={cn("space-y-2", className)} {...props} />
        </FormItemContext.Provider>
    )
})
GlassFormItem.displayName = "GlassFormItem"

const GlassFormLabel = React.forwardRef<
    React.ElementRef<typeof GlassLabel>,
    React.ComponentPropsWithoutRef<typeof GlassLabel>
>(({ className, ...props }, ref) => {
    const { error, formItemId } = useFormField()

    return (
        <GlassLabel
            ref={ref}
            className={cn(error && "text-destructive", className)}
            htmlFor={formItemId}
            {...props}
        />
    )
})
GlassFormLabel.displayName = "GlassFormLabel"

const GlassFormControl = React.forwardRef<
    React.ElementRef<typeof Slot>,
    React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
    const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

    return (
        <Slot
            ref={ref}
            id={formItemId}
            aria-describedby={
                !error
                    ? `${formDescriptionId}`
                    : `${formDescriptionId} ${formMessageId}`
            }
            aria-invalid={!!error}
            {...props}
        />
    )
})
GlassFormControl.displayName = "GlassFormControl"

const GlassFormDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
    const { formDescriptionId } = useFormField()

    return (
        <p
            ref={ref}
            id={formDescriptionId}
            className={cn("text-xs text-muted-foreground", className)}
            {...props}
        />
    )
})
GlassFormDescription.displayName = "GlassFormDescription"

const GlassFormMessage = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
    const { error, formMessageId } = useFormField()
    const body = error ? String(error?.message) : children

    if (!body) {
        return null
    }

    return (
        <p
            ref={ref}
            id={formMessageId}
            className={cn("text-xs font-medium text-destructive", className)}
            {...props}
        >
            {body}
        </p>
    )
})
GlassFormMessage.displayName = "GlassFormMessage"

export {
    useFormField,
    GlassForm,
    GlassFormItem,
    GlassFormLabel,
    GlassFormControl,
    GlassFormDescription,
    GlassFormMessage,
    GlassFormField,
}
