/**
 * EditMenu
 *
 * Standard Edit menu with clipboard operations,
 * resource clipboard for AI resources, and
 * "Paste As Context" submenu for AI agent context blocks.
 */
import { useMemo } from 'react';
import {
    Scissors,
    Copy,
    Clipboard,
    ClipboardList,
    User,
    Phone,
    MapPin,
    Truck,
    Landmark,
    Building2,
    Briefcase,
    FileText,
    CreditCard,
    Receipt,
    Package,
} from 'lucide-react';
import type { MenuItemDef } from '@/context/MenuBarContext';
import { useResourceStore } from '@/stores/resourceStore';
import { useFocusedTarget } from '@/hooks/useFocusedTarget';

export function useEditMenuItems(): MenuItemDef[] {
    const clipboard = useResourceStore((s) => s.clipboard);
    const { pasteResource, clearClipboard } = useResourceStore();
    const target = useFocusedTarget();

    return useMemo<MenuItemDef[]>(() => [
        {
            id: 'cut',
            label: 'Cut',
            icon: Scissors,
            shortcut: '⌘X',
            action: () => {
                document.execCommand('cut');
            },
        },
        {
            id: 'copy',
            label: 'Copy',
            icon: Copy,
            shortcut: '⌘C',
            action: () => {
                document.execCommand('copy');
            },
        },
        {
            id: 'paste',
            label: 'Paste',
            icon: Clipboard,
            shortcut: '⌘V',
            action: () => {
                document.execCommand('paste');
            },
        },
        { id: 'sep-1', label: '', dividerAfter: true },

        // Resource Clipboard
        {
            id: 'paste-resource',
            label: clipboard
                ? `Paste Resource: ${clipboard.resource.name}`
                : 'Paste Resource',
            icon: Package,
            shortcut: '⌘⇧V',
            disabled: !clipboard,
            action: () => {
                if (clipboard) {
                    pasteResource(target.ownerType, target.ownerId);
                }
            },
        },
        ...(clipboard ? [{
            id: 'clear-clipboard',
            label: 'Clear Resource Clipboard',
            action: () => clearClipboard(),
        }] : []),
        { id: 'sep-2', label: '', dividerAfter: true },

        // Paste As Context
        {
            id: 'paste-as-context',
            label: 'Paste As Context',
            icon: ClipboardList,
            submenu: [
                {
                    id: 'personal-profile',
                    label: 'Personal Profile',
                    icon: User,
                    action: () => console.log('Paste: Personal Profile'),
                },
                {
                    id: 'contact-details',
                    label: 'Contact Details',
                    icon: Phone,
                    action: () => console.log('Paste: Contact Details'),
                },
                {
                    id: 'mailing-address',
                    label: 'Mailing Address',
                    icon: MapPin,
                    action: () => console.log('Paste: Mailing Address'),
                },
                {
                    id: 'shipping-address',
                    label: 'Shipping Address',
                    icon: Truck,
                    action: () => console.log('Paste: Shipping Address'),
                },
                {
                    id: 'bank-details',
                    label: 'Bank Details',
                    icon: Landmark,
                    action: () => console.log('Paste: Bank Details'),
                },
                { id: 'sep-context-1', label: '', dividerAfter: true },
                {
                    id: 'company-profile',
                    label: 'Company Profile',
                    icon: Building2,
                    action: () => console.log('Paste: Company Profile'),
                },
                {
                    id: 'business-contact',
                    label: 'Business Contact',
                    icon: Briefcase,
                    action: () => console.log('Paste: Business Contact'),
                },
                {
                    id: 'invoice-address',
                    label: 'Invoice Address',
                    icon: FileText,
                    action: () => console.log('Paste: Invoice Address'),
                },
                {
                    id: 'payment-details',
                    label: 'Payment Details',
                    icon: CreditCard,
                    action: () => console.log('Paste: Payment Details'),
                },
                {
                    id: 'vat-tax-info',
                    label: 'VAT / Tax Info',
                    icon: Receipt,
                    action: () => console.log('Paste: VAT / Tax Info'),
                },
            ],
        },
    ], [clipboard, pasteResource, clearClipboard, target]);
}
