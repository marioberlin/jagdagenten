import { ComponentPreview, PreviewGroup } from '@/components';
import { GlassButton } from '@/components';
import { GlassCode } from '@/components';
import { Heart, Share2, MoreHorizontal } from 'lucide-react';

export const ShowcaseButtons = () => {
    return (
        <div className="space-y-8">
            <ComponentPreview
                id="buttons"
                title="Buttons"
                badge="Interactive"
                badgeColor="green"
                description="Glass-styled buttons with multiple variants for different interaction levels."
            >
                <PreviewGroup label="Primary actions (Thick Glass + Accent Tint)">
                    <GlassButton variant="primary" size="lg">Get Started</GlassButton>
                    <GlassButton variant="primary">Confirm</GlassButton>
                    <GlassButton variant="primary" size="sm">Add</GlassButton>
                </PreviewGroup>
                <GlassCode
                    language="tsx"
                    showLineNumbers={false}
                    code={`<GlassButton variant="primary" size="lg">Get Started</GlassButton>
<GlassButton variant="primary">Confirm</GlassButton>
<GlassButton variant="primary" size="sm">Add</GlassButton>`}
                />

                <PreviewGroup label="Secondary actions (Regular Glass)">
                    <GlassButton variant="secondary" size="lg">View Profile</GlassButton>
                    <GlassButton variant="secondary">Edit</GlassButton>
                    <GlassButton variant="secondary" size="sm">Cancel</GlassButton>
                </PreviewGroup>
                <GlassCode
                    language="tsx"
                    showLineNumbers={false}
                    code={`<GlassButton variant="secondary">Edit</GlassButton>`}
                />

                <PreviewGroup label="Ghost / Icons (Thin Glass, borderless)">
                    <GlassButton variant="ghost">Skip</GlassButton>
                    <GlassButton variant="ghost" className="rounded-full !p-3">
                        <Heart size={20} />
                    </GlassButton>
                    <GlassButton variant="ghost" className="rounded-full !p-3">
                        <Share2 size={20} />
                    </GlassButton>
                    <GlassButton variant="ghost" className="rounded-full !p-3">
                        <MoreHorizontal size={20} />
                    </GlassButton>
                </PreviewGroup>
                <GlassCode
                    language="tsx"
                    showLineNumbers={false}
                    code={`<GlassButton variant="ghost">Skip</GlassButton>
<GlassButton variant="ghost" className="rounded-full !p-3">
  <Heart size={20} />
</GlassButton>`}
                />

                <PreviewGroup label="Outline variant">
                    <GlassButton variant="outline" size="lg">Learn More</GlassButton>
                    <GlassButton variant="outline">Details</GlassButton>
                </PreviewGroup>
                <GlassCode
                    language="tsx"
                    showLineNumbers={false}
                    code={`<GlassButton variant="outline">Details</GlassButton>`}
                />

                <PreviewGroup label="Destructive actions">
                    <GlassButton variant="destructive">Delete</GlassButton>
                    <GlassButton variant="destructive" size="sm">Remove</GlassButton>
                </PreviewGroup>
                <GlassCode
                    language="tsx"
                    showLineNumbers={false}
                    code={`<GlassButton variant="destructive">Delete</GlassButton>`}
                />

                <PreviewGroup label="Loading states">
                    <GlassButton variant="primary" loading>Saving...</GlassButton>
                    <GlassButton variant="secondary" loading>Loading</GlassButton>
                </PreviewGroup>
                <GlassCode
                    language="tsx"
                    showLineNumbers={false}
                    code={`<GlassButton variant="primary" loading>Saving...</GlassButton>`}
                />
            </ComponentPreview>
        </div>
    );
};
