import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import Button from './Button';

const Table = ({
  columns,
  data,
  onEdit,
  onDelete,
  customActions,
  emptyMessage = 'Chưa có dữ liệu'
}) => {
  // Only show actions column if onEdit or onDelete are provided
  const showActionsColumn = onEdit || onDelete;

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {col.header}
              </th>
            ))}
            {showActionsColumn && (
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (showActionsColumn ? 1 : 0)}
                className="px-6 py-8 text-center text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="px-6 py-4 text-sm text-gray-900">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {showActionsColumn && (
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    {customActions && customActions(row)}
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(row)}
                        icon={Edit}
                        className="mr-2"
                      >
                        Sửa
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(row)}
                        icon={Trash2}
                        className="text-red-600 hover:bg-red-50"
                      >
                        Xóa
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
