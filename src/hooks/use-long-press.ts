import { useCallback, useRef, useState } from 'react'

interface LongPressOptions {
  shouldPreventDefault?: boolean
  delay?: number
}

export function useLongPress(
  onLongPress: (event: React.MouseEvent | React.TouchEvent) => void,
  onClick?: (event: React.MouseEvent | React.TouchEvent) => void,
  { shouldPreventDefault = true, delay = 300 }: LongPressOptions = {},
) {
  const [longPressTriggered, setLongPressTriggered] = useState(false)
  const timeout = useRef<NodeJS.Timeout | undefined>(undefined)
  const target = useRef<EventTarget | undefined>(undefined)

  // preventDefault function defined before use
  const preventDefault = useCallback((event: Event) => {
    if (event.cancelable && shouldPreventDefault) {
      event.preventDefault()
    }
  }, [shouldPreventDefault])

  const start = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (shouldPreventDefault && event.target) {
        event.target.addEventListener(
          'touchend',
          preventDefault,
          { passive: false },
        )
        target.current = event.target
      }

      timeout.current = setTimeout(() => {
        onLongPress(event)
        setLongPressTriggered(true)
      }, delay)
    },
    [onLongPress, delay, shouldPreventDefault, preventDefault],
  )

  const clear = useCallback(
    (event: React.MouseEvent | React.TouchEvent, shouldTriggerClick = true) => {
      timeout.current && clearTimeout(timeout.current)
      shouldTriggerClick && !longPressTriggered && onClick?.(event)
      setLongPressTriggered(false)

      if (shouldPreventDefault && target.current) {
        (target.current as HTMLElement).removeEventListener('touchend', preventDefault)
      }
    },
    [shouldPreventDefault, onClick, longPressTriggered, preventDefault],
  )

  // Cancel long press if user moves too much
  const moveHandler = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (shouldPreventDefault) {
        event.preventDefault()
      }
      clear(event, false)
    },
    [clear, shouldPreventDefault],
  )

  return {
    onMouseDown: start,
    onTouchStart: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchEnd: clear,
    onTouchMove: moveHandler,
  }
}
