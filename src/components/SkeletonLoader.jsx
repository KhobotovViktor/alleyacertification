import React from 'react';

const Skeleton = ({ className = '', style = {} }) => (
  <div className={`skeleton ${className}`} style={style} />
);

export const DashboardSkeleton = () => (
  <div className="flex-col gap-6 animate-fade-in">
    <div className="bento-grid mb-8">
      <Skeleton className="bento-card bento-card-large" style={{ height: '160px' }} />
      <Skeleton className="bento-card" style={{ height: '160px' }} />
    </div>
    <div className="flex-col gap-4">
      <div className="skeleton-title" />
      <div className="bento-grid">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="bento-card" style={{ height: '140px' }} />
        ))}
      </div>
    </div>
  </div>
);

export const ListSkeleton = () => (
    <div className="flex-col gap-4 animate-fade-in">
        {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="glass-panel p-4 flex justify-between items-center">
                <div className="flex-col gap-2 w-1/2">
                    <div className="skeleton-title" style={{ width: '80%', marginBottom: '4px' }} />
                    <div className="skeleton-text" style={{ width: '40%' }} />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="skeleton-circle" style={{ width: '32px', height: '32px' }} />
                    <Skeleton className="skeleton-circle" style={{ width: '32px', height: '32px' }} />
                </div>
            </div>
        ))}
    </div>
);

export const EditorSkeleton = () => (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
        <div className="skeleton-title" style={{ width: '40%', height: '2rem' }} />
        <div className="card mt-6">
            <div className="flex-col gap-4">
                <div className="skeleton-text" style={{ height: '1rem', width: '30%' }} />
                <Skeleton className="skeleton-button" style={{ height: '3rem' }} />
                <div className="skeleton-text" style={{ height: '1rem', width: '20%', mt: '1rem' }} />
                <Skeleton className="skeleton-button" style={{ height: '8rem' }} />
            </div>
        </div>
    </div>
);

export const RunnerSkeleton = () => (
    <div className="max-w-3xl mx-auto p-6 animate-fade-in">
        <div className="flex justify-between items-center mb-8">
            <div className="skeleton-title" style={{ width: '50%', marginBottom: 0 }} />
            <Skeleton className="skeleton-circle" style={{ width: '100px', height: '40px', borderRadius: '12px' }} />
        </div>
        <div className="card">
            <div className="skeleton-title" style={{ width: '90%' }} />
            <div className="flex-col gap-3 mt-6">
                {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="skeleton-button" style={{ height: '3.5rem' }} />
                ))}
            </div>
        </div>
    </div>
);

export default Skeleton;
