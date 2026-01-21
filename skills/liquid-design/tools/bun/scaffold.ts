import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const componentName = process.argv[2];

if (!componentName) {
    console.error('Usage: bun scaffold.ts <ComponentName>');
    process.exit(1);
}

const componentCode = `import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { motion } from 'framer-motion';

interface ${componentName}Props {
  children?: React.ReactNode;
  className?: string;
}

export const ${componentName}: React.FC<${componentName}Props> = ({ children, className = '' }) => {
  const { theme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={\`glass-card p-4 \${className}\`}
    >
      {children}
    </motion.div>
  );
};
`;

const dir = join(process.cwd(), 'src/components/temp');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, `${componentName}.tsx`), componentCode);

console.log(`✅ Component ${componentName} scaffolded in src/components/temp/${componentName}.tsx`);
console.log(`💡 Remember to move it to the appropriate category folder!`);
