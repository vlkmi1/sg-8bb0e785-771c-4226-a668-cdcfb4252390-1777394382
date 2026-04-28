import { useEffect, useRef, useState, ReactNode } from "react";

interface LazyWidgetProps {
  children: ReactNode;
  fallback: ReactNode;
  rootMargin?: string;
  threshold?: number;
}

export function LazyWidget({ 
  children, 
  fallback, 
  rootMargin = "100px",
  threshold = 0.1 
}: LazyWidgetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return (
    <div ref={ref}>
      {isVisible ? children : fallback}
    </div>
  );
}