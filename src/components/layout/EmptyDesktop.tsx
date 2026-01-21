/**
 * EmptyDesktop
 *
 * A completely empty desktop background component.
 * Used as the backdrop when app windows are open,
 * providing a clean canvas that lets the gradient
 * background shine through without any content.
 */
export const EmptyDesktop: React.FC = () => {
    return (
        <div className="w-full h-full" aria-hidden="true">
            {/* Intentionally empty - just the spatial canvas gradient shows through */}
        </div>
    );
};
