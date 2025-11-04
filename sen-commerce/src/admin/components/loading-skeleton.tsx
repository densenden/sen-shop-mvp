/**
 * Loading Skeleton Components
 * Provides skeleton loaders for better perceived performance
 */

import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  circle = false,
  count = 1,
}) => {
  const skeletonStyle: React.CSSProperties = {
    width: width || '100%',
    height: height || '1rem',
    borderRadius: circle ? '50%' : '0.375rem',
  };

  const skeletonClass = `animate-pulse bg-ui-bg-subtle dark:bg-ui-bg-base ${className}`;

  if (count === 1) {
    return <div className={skeletonClass} style={skeletonStyle} />;
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={skeletonClass} style={skeletonStyle} />
      ))}
    </>
  );
};

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-lg border border-ui-border-base bg-ui-bg-base dark:bg-ui-bg-subtle p-4 space-y-4">
      {/* Image Skeleton */}
      <Skeleton height={192} className="w-full" />

      {/* Provider Badge Skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton width={80} height={24} />
      </div>

      {/* Title Skeleton */}
      <Skeleton height={24} className="w-3/4" />

      {/* Description Skeleton */}
      <div className="space-y-2">
        <Skeleton height={16} />
        <Skeleton height={16} className="w-5/6" />
      </div>

      {/* Stats Skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton width={60} height={16} />
        <Skeleton width={80} height={16} />
      </div>

      {/* Actions Skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton width={100} height={36} />
        <Skeleton width={100} height={36} />
      </div>
    </div>
  );
};

export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 5 }) => {
  return (
    <tr className="border-b border-ui-border-base">
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="p-3">
          <Skeleton height={20} />
        </td>
      ))}
    </tr>
  );
};

export const DashboardMetricSkeleton: React.FC = () => {
  return (
    <div className="rounded-lg border border-ui-border-base bg-ui-bg-base dark:bg-ui-bg-subtle p-4 space-y-3">
      <Skeleton width={120} height={14} />
      <Skeleton width={80} height={32} />
    </div>
  );
};

export const TemplateCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-lg border border-ui-border-base bg-ui-bg-base dark:bg-ui-bg-subtle p-4 space-y-3">
      {/* Preview Image Skeleton */}
      <Skeleton height={128} className="w-full" />

      {/* Title Skeleton */}
      <Skeleton height={20} className="w-3/4" />

      {/* Description Skeleton */}
      <div className="space-y-2">
        <Skeleton height={14} />
        <Skeleton height={14} className="w-5/6" />
      </div>

      {/* Tags Skeleton */}
      <div className="flex gap-2">
        <Skeleton width={60} height={20} />
        <Skeleton width={70} height={20} />
        <Skeleton width={50} height={20} />
      </div>

      {/* Stats Skeleton */}
      <div className="flex items-center justify-between pt-2 border-t border-ui-border-base">
        <Skeleton width={80} height={16} />
        <Skeleton width={60} height={16} />
      </div>
    </div>
  );
};

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 9 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-ui-border-base">
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="p-3 text-left">
                <Skeleton height={20} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, index) => (
            <TableRowSkeleton key={index} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const FormSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Field 1 */}
      <div className="space-y-2">
        <Skeleton width={100} height={16} />
        <Skeleton height={40} />
      </div>

      {/* Field 2 */}
      <div className="space-y-2">
        <Skeleton width={120} height={16} />
        <Skeleton height={40} />
      </div>

      {/* Field 3 (Textarea) */}
      <div className="space-y-2">
        <Skeleton width={80} height={16} />
        <Skeleton height={120} />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Skeleton width={100} height={40} />
        <Skeleton width={100} height={40} />
      </div>
    </div>
  );
};
