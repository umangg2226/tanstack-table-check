import React, { CSSProperties } from 'react'

import './App.css'

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  Row,
  useReactTable,
  Column,
  ColumnPinningState,
} from '@tanstack/react-table'

import { useVirtualizer } from '@tanstack/react-virtual'

import { makeColumns, makeData, Person } from './makeData'

const getCommonPinningStyles = (column: Column<Person>): CSSProperties => {
  const isPinned = column.getIsPinned()
  const isLastLeftPinnedColumn =
    isPinned === 'left' && column.getIsLastColumn('left')
  const isFirstRightPinnedColumn =
    isPinned === 'right' && column.getIsFirstColumn('right')

  return {
    boxShadow: isLastLeftPinnedColumn
      ? '-4px 0 4px -4px gray inset'
      : isFirstRightPinnedColumn
      ? '4px 0 4px -4px gray inset'
      : undefined,
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    opacity: isPinned ? 0.95 : 1,
    position: isPinned ? 'sticky' : 'relative',
    width: column.getSize(),
    zIndex: isPinned ? 1 : 0,
  }
}

function App() {
  const columns = React.useMemo<ColumnDef<Person>[]>(
    () => makeColumns(1_000),
    []
  )

  const [data] = React.useState(() => makeData(1_000, columns))
  const [showTable, setShowTable] = React.useState(false)
  const [columnPinning] = React.useState<ColumnPinningState>({
    left: ['0'],
    right: [],
  })

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
    columnResizeDirection: 'ltr',
    columnResizeMode: 'onChange',
    state: {
      columnPinning,
    },
  })

  const { rows } = table.getRowModel()

  const visibleColumns = table.getVisibleLeafColumns()

  const tableContainerRef = React.useRef<HTMLDivElement>(null)

  const columnVirtualizer = useVirtualizer({
    count: visibleColumns.length,
    estimateSize: (index) => visibleColumns[index].getSize(),
    getScrollElement: () => tableContainerRef.current,
    horizontal: true,
    overscan: 3,
  })

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 33,
    getScrollElement: () => tableContainerRef.current,
    measureElement:
      typeof window !== 'undefined' &&
      navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 5,
  })

  const virtualColumns = columnVirtualizer.getVirtualItems()
  const virtualRows = rowVirtualizer.getVirtualItems()

  let virtualPaddingLeft: number | undefined
  let virtualPaddingRight: number | undefined

  if (columnVirtualizer && virtualColumns?.length) {
    virtualPaddingLeft = virtualColumns[0]?.start ?? 0
    virtualPaddingRight =
      columnVirtualizer.getTotalSize() -
      (virtualColumns[virtualColumns.length - 1]?.end ?? 0)
  }

  return (
    <div className='app'>
      <button onClick={() => setShowTable((prev) => !prev)}>
        click to render/hide table
      </button>
      {!showTable ? (
        <></>
      ) : (
        <>
          <div style={{ marginTop: '10px' }}>
            ({columns.length.toLocaleString()} columns)
          </div>
          <div>({data.length.toLocaleString()} rows)</div>

          <div
            className='container'
            ref={tableContainerRef}
            style={{
              overflow: 'auto',
              position: 'relative',
              height: '400px',
            }}
          >
            <table style={{ display: 'grid' }}>
              <thead
                style={{
                  display: 'grid',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                }}
              >
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    key={headerGroup.id}
                    style={{ display: 'flex', width: '100%' }}
                  >
                    {/* Render the left-pinned column */}
                    {columnPinning?.left?.map((pin) => {
                      const header = headerGroup.headers.find(
                        (h) => h.id === pin
                      )
                      return header ? (
                        <th
                          key={header.id}
                          style={{
                            display: 'flex',
                            width: header.getSize(),
                            ...getCommonPinningStyles(header.column),
                          }}
                        >
                          <div
                            {...{
                              className: header.column.getCanSort()
                                ? 'cursor-pointer select-none'
                                : '',
                              onClick: header.column.getToggleSortingHandler(),
                            }}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {{
                              asc: ' 🔼',
                              desc: ' 🔽',
                            }[header.column.getIsSorted() as string] ?? null}
                          </div>
                          <div
                            {...{
                              onDoubleClick: () => header.column.resetSize(),
                              onMouseDown: header.getResizeHandler(),
                              onTouchStart: header.getResizeHandler(),
                              className: `resizer ${
                                table.options.columnResizeDirection
                              } ${
                                header.column.getIsResizing()
                                  ? 'isResizing'
                                  : ''
                              }`,
                            }}
                          />
                        </th>
                      ) : null
                    })}

                    {/* Render the virtualized columns */}
                    {virtualPaddingLeft ? (
                      <th
                        style={{ display: 'flex', width: virtualPaddingLeft }}
                      />
                    ) : null}
                    {virtualColumns.map((vc) => {
                      const header = headerGroup.headers[vc.index]
                      return (
                        <th
                          key={header.id}
                          style={{
                            display: 'flex',
                            width: header.getSize(),
                            ...getCommonPinningStyles(header.column),
                          }}
                        >
                          <div
                            {...{
                              className: header.column.getCanSort()
                                ? 'cursor-pointer select-none'
                                : '',
                              onClick: header.column.getToggleSortingHandler(),
                            }}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {{
                              asc: ' 🔼',
                              desc: ' 🔽',
                            }[header.column.getIsSorted() as string] ?? null}
                          </div>
                          <div
                            {...{
                              onDoubleClick: () => header.column.resetSize(),
                              onMouseDown: header.getResizeHandler(),
                              onTouchStart: header.getResizeHandler(),
                              className: `resizer ${
                                table.options.columnResizeDirection
                              } ${
                                header.column.getIsResizing()
                                  ? 'isResizing'
                                  : ''
                              }`,
                            }}
                          />
                        </th>
                      )
                    })}
                    {virtualPaddingRight ? (
                      <th
                        style={{ display: 'flex', width: virtualPaddingRight }}
                      />
                    ) : null}
                  </tr>
                ))}
              </thead>
              <tbody
                style={{
                  display: 'grid',
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  position: 'relative',
                }}
              >
                {virtualRows.map((virtualRow) => {
                  const row = rows[virtualRow.index] as Row<Person>
                  const visibleCells = row.getVisibleCells()

                  return (
                    <tr
                      data-index={virtualRow.index}
                      ref={(node) => rowVirtualizer.measureElement(node)}
                      key={row.id}
                      style={{
                        display: 'flex',
                        position: 'absolute',
                        transform: `translateY(${virtualRow.start}px)`,
                        width: '100%',
                      }}
                    >
                      {/* Render the left-pinned column cells */}
                      {columnPinning?.left?.map((pin) => {
                        const cell = visibleCells.find(
                          (c) => c.column.id === pin
                        )
                        return cell ? (
                          <td
                            key={cell.id}
                            style={{
                              display: 'flex',
                              width: cell.column.getSize(),
                              ...getCommonPinningStyles(cell.column),
                            }}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ) : null
                      })}

                      {/* Render the virtualized cells */}
                      {virtualPaddingLeft ? (
                        <td
                          style={{ display: 'flex', width: virtualPaddingLeft }}
                        />
                      ) : null}
                      {virtualColumns.map((vc) => {
                        const cell = visibleCells[vc.index]
                        return (
                          <td
                            key={cell.id}
                            style={{
                              display: 'flex',
                              width: cell.column.getSize(),
                              ...getCommonPinningStyles(cell.column),
                            }}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        )
                      })}
                      {virtualPaddingRight ? (
                        <td
                          style={{
                            display: 'flex',
                            width: virtualPaddingRight,
                          }}
                        />
                      ) : null}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

export default App
