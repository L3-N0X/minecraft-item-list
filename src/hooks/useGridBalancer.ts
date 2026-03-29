import { useState, useLayoutEffect, type RefObject } from 'react'

export interface DummyPanel {
    id: string
    colSpan: number
}

export function useGridBalancer(gridRef: RefObject<HTMLDivElement | null>) {
    const [dummyPanels, setDummyPanels] = useState<DummyPanel[]>([])

    useLayoutEffect(() => {
        if (!gridRef.current) return
        const container = gridRef.current

        let isRunning = false
        const balanceGrid = () => {
            if (isRunning) return
            isRunning = true

            // 1. Reset any previously applied expansions so we can measure the "natural" CSS Grid layout
            const children = Array.from(container.children) as HTMLElement[]
            const contentChildren = children.filter(
                (c) => !c.hasAttribute('data-dummy')
            )

            contentChildren.forEach((child) => {
                child.style.gridColumn = ''
            })

            // Force a synchronous layout to read the natural rects
            container.getBoundingClientRect()

            const containerStyle = window.getComputedStyle(container)

            // Parse grid gaps
            const rowGap = parseFloat(containerStyle.rowGap) || 0
            const colGap = parseFloat(containerStyle.columnGap) || 0

            // Determine actual number of columns from computed style
            // e.g., "100px 100px" -> 2 columns
            const gridTemplateColumns = containerStyle.gridTemplateColumns
            if (!gridTemplateColumns || gridTemplateColumns === 'none') {
                isRunning = false
                return
            }
            const columns = gridTemplateColumns.split(' ').length

            const containerRect = container.getBoundingClientRect()

            // Grid cell dimensions
            const totalColGaps = Math.max(0, columns - 1) * colGap
            const colWidth = (containerRect.width - totalColGaps) / columns
            // Get row height from first child or assume 160px based on auto-rows-[160px]
            // We use 160 as the base assumption since it's hardcoded in the component's Tailwind classes
            const baseRowHeight = 160

            let maxRow = 0

            // 2. Measure all natural positions
            const blocks = contentChildren.map((child) => {
                const rect = child.getBoundingClientRect()

                const relativeTop = rect.top - containerRect.top
                const relativeLeft = rect.left - containerRect.left

                const r = Math.round(relativeTop / (baseRowHeight + rowGap))
                const c = Math.round(relativeLeft / (colWidth + colGap))

                const w =
                    Math.round((rect.width + colGap) / (colWidth + colGap)) || 1
                const h =
                    Math.round(
                        (rect.height + rowGap) / (baseRowHeight + rowGap)
                    ) || 1

                maxRow = Math.max(maxRow, r + h)

                return { child, r, c, w, h }
            })

            // 3. Build 2D Matrix of occupied cells
            const grid = Array.from({ length: Math.max(maxRow, 1) }, () =>
                Array(columns).fill(false)
            )

            blocks.forEach((b) => {
                for (let i = 0; i < b.h; i++) {
                    for (let j = 0; j < b.w; j++) {
                        if (b.r + i < maxRow && b.c + j < columns) {
                            grid[b.r + i]![b.c + j] = true
                        }
                    }
                }
            })

            const newDummies: DummyPanel[] = []

            // 4. Phase 1: Try to expand elements to their right to swallow holes
            for (let r = 0; r < maxRow; r++) {
                for (let c = 0; c < columns; c++) {
                    if (!grid[r]![c]) {
                        // Found a hole at (r, c)
                        // Find the block immediately to its left that starts at or spans across this row
                        const leftBlock = blocks.find(
                            (b) => b.r <= r && b.r + b.h > r && b.c + b.w === c
                        )

                        if (leftBlock) {
                            // Verify the hole is vertically large enough for the left block
                            let canExpand = true
                            for (let i = 0; i < leftBlock.h; i++) {
                                if (
                                    leftBlock.r + i >= maxRow ||
                                    grid[leftBlock.r + i]![c]
                                ) {
                                    canExpand = false
                                    break
                                }
                            }

                            if (canExpand) {
                                // Expand the block!
                                leftBlock.w += 1
                                for (let i = 0; i < leftBlock.h; i++) {
                                    grid[leftBlock.r + i]![c] = true
                                }
                                leftBlock.child.style.gridColumn = `span ${leftBlock.w} / span ${leftBlock.w}`
                                // Since we modified grid[r][c], the next iteration for 'c' will see it as filled.
                            }
                        }
                    }
                }
            }

            // 5. Phase 2: Group any remaining un-swallowed holes into contiguous dummy panels
            for (let r = 0; r < maxRow; r++) {
                let currentHoleSize = 0
                let holeStartC = -1
                for (let c = 0; c <= columns; c++) {
                    if (c < columns && !grid[r]![c]) {
                        if (currentHoleSize === 0) holeStartC = c
                        currentHoleSize++
                        grid[r]![c] = true
                    } else {
                        if (currentHoleSize > 0) {
                            newDummies.push({
                                id: `dummy-${r}-${holeStartC}`,
                                colSpan: currentHoleSize,
                            })
                            currentHoleSize = 0
                        }
                    }
                }
            }

            setDummyPanels((prev) => {
                if (prev.length !== newDummies.length) return newDummies
                const isDifferent = prev.some(
                    (p, i) =>
                        p.colSpan !== newDummies[i]?.colSpan ||
                        p.id !== newDummies[i]?.id
                )
                return isDifferent ? newDummies : prev
            })

            isRunning = false
        }

        const resizeObserver = new ResizeObserver(() => {
            // Debounce slightly to prevent thrashing during fast resizes
            requestAnimationFrame(balanceGrid)
        })

        // Use a MutationObserver to re-run if children are added/removed
        const mutationObserver = new MutationObserver((mutations) => {
            // Only trigger if children added/removed (not attribute changes like style)
            const hasChildChanges = mutations.some(
                (m) => m.type === 'childList'
            )
            if (hasChildChanges) {
                requestAnimationFrame(balanceGrid)
            }
        })

        resizeObserver.observe(container)
        mutationObserver.observe(container, { childList: true })

        // Initial run
        requestAnimationFrame(balanceGrid)

        return () => {
            resizeObserver.disconnect()
            mutationObserver.disconnect()
        }
    }, [gridRef])

    return { dummyPanels }
}
