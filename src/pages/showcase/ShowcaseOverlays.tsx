
import { useState } from 'react';
import { GlassContainer } from '@/components';
import { GlassButton } from '@/components';
import { GlassModal } from '@/components';
import { GlassSheet } from '@/components';
import { GlassTour } from '@/components';
import { GlassTooltip } from '@/components';
import { GlassDropdown, GlassDropdownItem, GlassDropdownLabel, GlassDropdownSeparator } from '@/components';
import { GlassHoverCard } from '@/components';
import { GlassPopover } from '@/components';
import { GlassContextMenu } from '@/components';
import { GlassInput } from '@/components';
import { GlassSeparator } from '@/components';
import { GlassBadge, GlassCode } from '@/components';
import { GlassAvatar } from '@/components';
import { GlassAlertDialog } from '@/components';
import { GlassDrawer } from '@/components';
import { Heart, User, Settings, CreditCard, LogOut, ChevronDown, Trash2, Menu, Bell } from 'lucide-react';

export const ShowcaseOverlays = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [tourOpen, setTourOpen] = useState(false);
    const [alertOpen, setAlertOpen] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);


    return (
        <div className="space-y-8">
            <GlassModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Liquid Modal">
                <div className="space-y-4">
                    <p className="text-secondary leading-relaxed">
                        This modal uses a thick glass material with a subtle backdrop blur. It animates using spring physics, appearing to flow into existence.
                    </p>
                    <div className="h-32 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                        <span className="text-sm text-primary font-medium">Content Area</span>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <GlassButton variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</GlassButton>
                        <GlassButton variant="primary" onClick={() => setIsModalOpen(false)}>Confirm</GlassButton>
                    </div>
                </div>
            </GlassModal>

            <GlassSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                title="Edit Profile"
                description="Make changes to your profile here."
            >
                <div className="space-y-6 mt-4">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-secondary uppercase">Name</label>
                        <GlassInput defaultValue="Mario" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-secondary uppercase">Username</label>
                        <GlassInput defaultValue="@mariocortex" />
                    </div>
                    <GlassSeparator />
                    <div className="flex justify-end pt-4">
                        <GlassButton variant="primary" onClick={() => setSheetOpen(false)}>Save Changes</GlassButton>
                    </div>
                </div>
            </GlassSheet>

            {/* Alert Dialog Portal */}
            <GlassAlertDialog
                open={alertOpen}
                onOpenChange={setAlertOpen}
                variant="destructive"
                title="Delete Project?"
                description="This will permanently delete the project and all its data. This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={() => setAlertOpen(false)}
            />

            {/* Drawer Portal */}
            <GlassDrawer
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                title="Quick Actions"
                description="Swipe down to dismiss"
                size="md"
            >
                <div className="space-y-4">
                    <GlassButton variant="secondary" className="w-full justify-start gap-3">
                        <Bell size={18} />
                        <span>Notifications</span>
                    </GlassButton>
                    <GlassButton variant="secondary" className="w-full justify-start gap-3">
                        <Settings size={18} />
                        <span>Settings</span>
                    </GlassButton>
                    <GlassButton variant="secondary" className="w-full justify-start gap-3">
                        <User size={18} />
                        <span>Profile</span>
                    </GlassButton>
                    <GlassSeparator />
                    <GlassButton variant="ghost" className="w-full justify-start gap-3 text-red-400">
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </GlassButton>
                </div>
            </GlassDrawer>

            {/* Overlays & Navigation */}
            <GlassContainer id="modals" className="p-8 rounded-3xl" border material="regular">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-green-400">Interactive</span>
                        <h3 className="text-xl font-bold text-primary">Overlays & Navigation</h3>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Tooltips */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Tooltips</span>
                        <div className="flex gap-4 items-center">
                            <GlassTooltip content="This is Liquid Glass">
                                <GlassButton variant="secondary">Hover me</GlassButton>
                            </GlassTooltip>
                            <GlassTooltip content="Add to library" side="right">
                                <GlassButton variant="ghost" className="rounded-full !p-3">
                                    <Heart size={20} />
                                </GlassButton>
                            </GlassTooltip>
                        </div>
                    </div>

                    {/* Sheet */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Sheets / Modals</span>
                        <div className="flex flex-wrap gap-3">
                            <GlassButton variant="primary" onClick={() => setIsModalOpen(true)}>Open Modal</GlassButton>
                            <GlassButton variant="secondary" onClick={() => setSheetOpen(true)}>Open Sheet</GlassButton>
                        </div>
                        <GlassCode
                            className="mt-4"
                            language="tsx"
                            showLineNumbers={false}
                            code={`<GlassSheet open={open} onOpenChange={setOpen} title="Edit">
  {/* content */}
</GlassSheet>`}
                        />
                    </div>

                    {/* Phase 2: Alert Dialog & Drawer */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">AlertDialog / Drawer</span>
                        <div className="flex flex-wrap gap-3">
                            <GlassButton variant="destructive" onClick={() => setAlertOpen(true)}>
                                <Trash2 size={16} />
                                Delete Item
                            </GlassButton>
                            <GlassButton variant="secondary" onClick={() => setDrawerOpen(true)}>
                                <Menu size={16} />
                                Open Drawer
                            </GlassButton>
                        </div>
                        <GlassCode
                            className="mt-4"
                            language="tsx"
                            showLineNumbers={false}
                            code={`<GlassAlertDialog open={open} onOpenChange={setOpen} title="Delete?" />
<GlassDrawer open={open} onOpenChange={setOpen} title="Actions" />`}
                        />
                    </div>


                    {/* Dropdown */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Dropdowns</span>
                        <GlassDropdown
                            trigger={<GlassButton variant="secondary" className="w-full justify-between">Options <ChevronDown size={14} /></GlassButton>}
                        >
                            <GlassDropdownLabel>My Account</GlassDropdownLabel>
                            <GlassDropdownItem icon={User}>Profile</GlassDropdownItem>
                            <GlassDropdownItem icon={Settings}>Settings</GlassDropdownItem>
                            <GlassDropdownItem icon={CreditCard}>Billing</GlassDropdownItem>
                            <GlassDropdownSeparator />
                            <GlassDropdownItem icon={LogOut} className="text-red-400 hover:text-red-300">Log out</GlassDropdownItem>
                        </GlassDropdown>
                    </div>

                    {/* Context Menu */}
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Context Menu</span>
                        <GlassContextMenu
                            trigger={
                                <div className="w-full min-w-[200px] rounded-xl border border-dashed border-[var(--glass-border)] hover:border-label-glass-secondary flex items-center justify-center text-sm text-label-glass-secondary transition-colors cursor-context-menu bg-[var(--glass-surface)] py-6 px-8">
                                    Right Click Here
                                </div>
                            }
                            content={
                                <div className="flex flex-col w-32 p-1">
                                    <GlassButton variant="ghost" size="sm" className="justify-start">Back</GlassButton>
                                    <GlassButton variant="ghost" size="sm" className="justify-start">Forward</GlassButton>
                                    <GlassButton variant="ghost" size="sm" className="justify-start">Reload</GlassButton>
                                    <GlassButton variant="ghost" size="sm" className="justify-start">Save As...</GlassButton>
                                </div>
                            }
                        />
                        <GlassCode
                            className="mt-4"
                            language="tsx"
                            showLineNumbers={false}
                            code={`<GlassContextMenu trigger={<Target />} content={<Menu />} />`}
                        />
                    </div>
                </div>
            </GlassContainer>

            {/* Visual & Popovers */}
            <GlassContainer id="popovers" className="p-8 rounded-3xl" border material="regular">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-green-400">Interactive</span>
                        <h3 className="text-xl font-bold text-primary">Visual & Popovers</h3>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pb-48">
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Hover Card</span>
                        <div className="flex justify-center pt-4">
                            <GlassHoverCard
                                trigger={<GlassButton variant="primary">Hover Me</GlassButton>}
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <GlassAvatar size="md" src="https://github.com/shadcn.png" />
                                        <div className="space-y-0.5">
                                            <h4 className="text-sm font-semibold text-primary">@shadcn</h4>
                                            <p className="text-xs text-secondary">The creator of shadcn/ui.</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-secondary/80">
                                        Beautifully designed components built with Radix UI and Tailwind CSS.
                                    </p>
                                </div>
                            </GlassHoverCard>
                        </div>
                        <GlassCode
                            className="mt-4"
                            language="tsx"
                            showLineNumbers={false}
                            code={`<GlassHoverCard trigger={<Button />}>
  {/* user info */}
</GlassHoverCard>`}
                        />
                    </div>

                    <div className="space-y-4">
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Popover</span>
                        <div className="flex justify-center pt-4">
                            <GlassPopover
                                trigger={<GlassButton variant="secondary">Click Me</GlassButton>}
                            >
                                <div className="space-y-4">
                                    <h4 className="font-medium text-primary leading-none">Dimensions</h4>
                                    <p className="text-sm text-secondary">Set the dimensions for the layer.</p>
                                    <div className="space-y-2">
                                        <GlassInput defaultValue="100%" placeholder="Width" />
                                        <GlassInput defaultValue="25px" placeholder="Height" />
                                    </div>
                                </div>
                            </GlassPopover>
                        </div>
                        <GlassCode
                            className="mt-4"
                            language="tsx"
                            showLineNumbers={false}
                            code={`<GlassPopover trigger={<Button />}>
  {/* form content */}
</GlassPopover>`}
                        />
                    </div>
                </div>
            </GlassContainer>

            {/* Guided Tour */}
            <GlassContainer id="tooltips" className="p-8 rounded-3xl" border material="regular">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-green-400">Interactive</span>
                        <h3 className="text-xl font-bold text-primary">Onboarding & Guidance</h3>
                    </div>
                    <GlassBadge variant="glass">New</GlassBadge>
                </div>

                <div className="space-y-4">
                    <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block">Product Tour</span>
                    <div className="flex items-center gap-4">
                        <GlassButton variant="primary" onClick={() => setTourOpen(true)}>Start Tour</GlassButton>
                        <p className="text-sm text-secondary">Click to start a guided tour of the interface.</p>
                    </div>

                    <GlassTour
                        isOpen={tourOpen}
                        onClose={() => setTourOpen(false)}
                        steps={[
                            { title: 'Welcome', description: 'This is the Liquid Glass showcase.' },
                            { title: 'Overlays', description: 'We are currently exploring the overlay components.' },
                            { title: 'Finish', description: 'Enjoy building with Liquid Glass!' }
                        ]}
                    />
                    <GlassCode
                        className="mt-4"
                        language="tsx"
                        showLineNumbers={false}
                        code={`<GlassTour isOpen={open} onClose={fn} steps={[{ title: 'Welcome', description: 'Hi!' }]} />`}
                    />
                </div>
            </GlassContainer>

            {/* Code Examples */}
            <GlassContainer className="p-8 rounded-3xl" border material="regular">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest mb-2 block text-green-400">Interactive</span>
                        <h3 className="text-xl font-bold text-primary">Usage Examples</h3>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-3">Modal</span>
                        <GlassCode
                            language="tsx"
                            showLineNumbers={false}
                            code={`<GlassModal 
  isOpen={open} 
  onClose={() => setOpen(false)} 
  title="Title"
>
  {/* content */}
</GlassModal>`}
                        />
                    </div>
                    <div>
                        <span className="text-xs font-bold text-label-tertiary uppercase tracking-widest block mb-3">Tooltip & Dropdown</span>
                        <GlassCode
                            language="tsx"
                            showLineNumbers={false}
                            code={`<GlassTooltip content="Info">
  <button>Hover me</button>
</GlassTooltip>

<GlassDropdown trigger={<Button />}>
  <GlassDropdownItem>Option 1</GlassDropdownItem>
</GlassDropdown>`}
                        />
                    </div>
                </div>
            </GlassContainer>
        </div>
    );
};
