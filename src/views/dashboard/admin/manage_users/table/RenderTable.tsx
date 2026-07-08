import { type FC, useEffect, useState } from 'react';
import { columns } from './Column';
import { DataTable } from './DataTable';
import { DataTablePagination } from './data-table-pagination';
import { useManageUsersStore } from '../stores/user_store';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const RenderTableManageUsers: FC = () => {
  const { users, meta, isLoading, fetchUsers } = useManageUsersStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [role,       setRole]       = useState('all');
  const [status,     setStatus]     = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize,    setPageSize]    = useState(20);
  const [selectedCount, setSelectedCount] = useState(0);

  const searchDebounced = useDebounce(searchTerm, 400);

  // Fetch khi filter/page thay đổi
  useEffect(() => {
    fetchUsers({
      page:     currentPage,
      per_page: pageSize,
      search:   searchDebounced || undefined,
      role:     role   !== 'all' ? role : undefined,
      blocked:  status !== 'all' ? status === 'true' : undefined,
    });
  }, [fetchUsers, currentPage, pageSize, searchDebounced, role, status]);

  const reset = () => setCurrentPage(1);

  return (
    <div className="overflow-x-auto">
      <DataTable
        columns={columns}
        data={users}
        loading={isLoading}
        onSelectionChange={setSelectedCount}
        searchTerm={searchTerm}
        onSearchChange={(v) => { setSearchTerm(v); reset(); }}
        role={role}
        onRoleChange={(v) => { setRole(v); reset(); }}
        status={status}
        onStatusChange={(v) => { setStatus(v); reset(); }}
      />
      <DataTablePagination
        total={meta.total}
        selectedCount={selectedCount}
        currentPage={currentPage}
        totalPages={meta.last_page}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(s) => { setPageSize(s); reset(); }}
      />
    </div>
  );
};

export default RenderTableManageUsers;
