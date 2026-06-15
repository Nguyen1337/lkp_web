import './SegmentedTabs.css';

export interface SegmentedTabOption<T extends string> {
  readonly id: T;
  readonly label: string;
}

export interface SegmentedTabsProps<T extends string> {
  readonly options: readonly SegmentedTabOption<T>[];
  readonly value: T;
  readonly onChange: (id: T) => void;
  readonly className?: string;
}

/** Переиспользуемый сегмент-контрол (вкладки) из UI-кита. */
export const SegmentedTabs = <T extends string>({ options, value, onChange, className }: SegmentedTabsProps<T>) => (
  <div className={`segmented${className ? ` ${className}` : ''}`} role="tablist">
    {options.map((option) => {
      const isActive = option.id === value;
      return (
        <button
          key={option.id}
          type="button"
          role="tab"
          aria-selected={isActive}
          className={`segmented__item${isActive ? ' segmented__item--active' : ''}`}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);
