import { SegmentedControl } from "./SegmentedControl";

interface ToggleProps<T extends string> {
  value: T;
  left: { value: T; label: string };
  right: { value: T; label: string };
  onChange: (value: T) => void;
  className?: string;
}

export function Toggle<T extends string>({
  value,
  left,
  right,
  onChange,
  className,
}: ToggleProps<T>) {
  return (
    <SegmentedControl
      value={value}
      options={[left, right]}
      onChange={onChange}
      className={className}
    />
  );
}
