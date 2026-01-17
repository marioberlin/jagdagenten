import type { Meta, StoryObj } from '@storybook/react';
import { GlassForm, GlassFormField, GlassFormItem, GlassFormLabel, GlassFormControl, GlassFormMessage } from './GlassForm';
import { GlassInput } from './GlassInput';
import { GlassButton } from '../primitives/GlassButton';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const meta: Meta<typeof GlassForm> = {
    title: 'Forms/GlassForm',
    component: GlassForm,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassForm>;

const userSchema = z.object({
    username: z.string().min(2, { message: 'Username must be at least 2 characters.' }),
    email: z.string().email(),
});

export const Default: Story = {
    render: () => {
        const form = useForm<z.infer<typeof userSchema>>({
            resolver: zodResolver(userSchema),
            defaultValues: {
                username: '',
                email: '',
            },
        });

        function onSubmit(values: z.infer<typeof userSchema>) {
            alert(JSON.stringify(values, null, 2));
        }

        return (
            <GlassForm {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-md">
                    <GlassFormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                            <GlassFormItem>
                                <GlassFormLabel>Username</GlassFormLabel>
                                <GlassFormControl>
                                    <GlassInput placeholder="johndoe" {...field} />
                                </GlassFormControl>
                                <GlassFormMessage />
                            </GlassFormItem>
                        )}
                    />
                    <GlassFormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <GlassFormItem>
                                <GlassFormLabel>Email</GlassFormLabel>
                                <GlassFormControl>
                                    <GlassInput placeholder="m@example.com" {...field} />
                                </GlassFormControl>
                                <GlassFormMessage />
                            </GlassFormItem>
                        )}
                    />
                    <GlassButton type="submit">Submit</GlassButton>
                </form>
            </GlassForm>
        );
    },
};
