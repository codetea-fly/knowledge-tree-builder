import React from 'react';
import { Database, FileText, Construction } from 'lucide-react';

interface PlaceholderConfigProps {
  configId: string;
  title: string;
  description: string;
}

export const PlaceholderConfig: React.FC<PlaceholderConfigProps> = ({
  configId,
  title,
  description,
}) => {
  const getIcon = () => {
    switch (configId) {
      case 'data-source':
        return <Database className="h-12 w-12 text-muted-foreground/50" />;
      case 'template':
        return <FileText className="h-12 w-12 text-muted-foreground/50" />;
      default:
        return <Construction className="h-12 w-12 text-muted-foreground/50" />;
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        {getIcon()}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-4">{description}</p>
      <div className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
        <p className="text-sm text-primary">即将推出</p>
      </div>
    </div>
  );
};
