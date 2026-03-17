import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export function Inspector() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!isEnabled) {
      setHoveredElement(null);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.inspector-toggle')) return;
      setHoveredElement(target);
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.inspector-toggle')) return;

      e.preventDefault();
      e.stopPropagation();

      console.log('Element Info:', {
        tagName: target.tagName,
        className: target.className,
        id: target.id,
        textContent: target.textContent?.slice(0, 100),
        attributes: Array.from(target.attributes).map(attr => ({
          name: attr.name,
          value: attr.value
        })),
        computedStyles: window.getComputedStyle(target),
        dimensions: {
          width: target.offsetWidth,
          height: target.offsetHeight,
          top: target.offsetTop,
          left: target.offsetLeft
        }
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick, true);
    };
  }, [isEnabled]);

  useEffect(() => {
    if (hoveredElement) {
      hoveredElement.style.outline = '2px solid #00ff00';
      hoveredElement.style.outlineOffset = '2px';
      return () => {
        hoveredElement.style.outline = '';
        hoveredElement.style.outlineOffset = '';
      };
    }
  }, [hoveredElement]);

  const getElementInfo = () => {
    if (!hoveredElement) return null;

    const styles = window.getComputedStyle(hoveredElement);
    const rect = hoveredElement.getBoundingClientRect();

    return {
      tag: hoveredElement.tagName.toLowerCase(),
      classes: hoveredElement.className,
      id: hoveredElement.id,
      dimensions: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
      position: `top: ${Math.round(rect.top)}, left: ${Math.round(rect.left)}`,
      display: styles.display,
      position_type: styles.position,
      zIndex: styles.zIndex,
      backgroundColor: styles.backgroundColor,
      color: styles.color,
      fontSize: styles.fontSize,
      padding: styles.padding,
      margin: styles.margin,
    };
  };

  const elementInfo = getElementInfo();

  return (
    <>
      <button
        onClick={() => setIsEnabled(!isEnabled)}
        className={`inspector-toggle fixed bottom-4 right-4 z-[9999] p-4 rounded-full shadow-lg transition-all ${
          isEnabled
            ? 'bg-green-500 hover:bg-green-600'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
        title={isEnabled ? 'Disable Inspector' : 'Enable Inspector'}
      >
        {isEnabled ? (
          <EyeOff className="w-6 h-6 text-white" />
        ) : (
          <Eye className="w-6 h-6 text-white" />
        )}
      </button>

      {isEnabled && elementInfo && (
        <div className="fixed bottom-20 right-4 z-[9999] bg-black/95 text-white p-4 rounded-lg shadow-xl max-w-sm text-xs font-mono">
          <div className="space-y-1">
            <div className="text-green-400 font-bold mb-2">Element Inspector</div>
            <div><span className="text-yellow-400">Tag:</span> {elementInfo.tag}</div>
            {elementInfo.id && (
              <div><span className="text-yellow-400">ID:</span> {elementInfo.id}</div>
            )}
            {elementInfo.classes && (
              <div className="break-all">
                <span className="text-yellow-400">Classes:</span> {elementInfo.classes}
              </div>
            )}
            <div><span className="text-yellow-400">Size:</span> {elementInfo.dimensions}</div>
            <div><span className="text-yellow-400">Position:</span> {elementInfo.position}</div>
            <div><span className="text-yellow-400">Display:</span> {elementInfo.display}</div>
            <div><span className="text-yellow-400">Position Type:</span> {elementInfo.position_type}</div>
            <div><span className="text-yellow-400">Z-Index:</span> {elementInfo.zIndex}</div>
            <div><span className="text-yellow-400">BG Color:</span> {elementInfo.backgroundColor}</div>
            <div><span className="text-yellow-400">Color:</span> {elementInfo.color}</div>
            <div><span className="text-yellow-400">Font Size:</span> {elementInfo.fontSize}</div>
            <div><span className="text-yellow-400">Padding:</span> {elementInfo.padding}</div>
            <div><span className="text-yellow-400">Margin:</span> {elementInfo.margin}</div>
          </div>
          <div className="mt-2 pt-2 border-t border-white/20 text-white/60 text-[10px]">
            Click element to log full details to console
          </div>
        </div>
      )}
    </>
  );
}
