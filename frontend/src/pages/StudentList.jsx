import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fetchStudents, deleteStudent } from '../api';
import { Search, Plus, Pencil, Trash2, Eye, ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react';

export default function StudentList() {
  const [students, setStudents]   = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [deleting, setDeleting]   = useState(null);
  const navigate = useNavigate();

  const load = useCallback(async (page = 1, q = search) => {
    setLoading(true);
    try {
      const res = await fetchStudents({ page, limit: pagination.limit, search: q });
      setStudents(res.data);
      setPagination((p) => ({ ...p, ...res.pagination }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, pagination.limit]);

  useEffect(() => { load(1); }, []); // eslint-disable-line

  const handleSearch = (e) => {
    e.preventDefault();
    load(1, search);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name}? This also removes all their marks.`)) return;
    setDeleting(id);
    try {
      await deleteStudent(id);
      toast.success(`${name} deleted`);
      load(pagination.page);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

  return (
    <div className="page">
      {/* ── Header ── */}
      <div className="page-header">
        <div className="page-title-group">
          <GraduationCap size={28} className="title-icon" />
          <div>
            <h1 className="page-title">Students</h1>
            <p className="page-sub">{pagination.total} enrolled</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/students/new')}>
          <Plus size={16} /> Add Student
        </button>
      </div>

      {/* ── Search ── */}
      <form className="search-bar" onSubmit={handleSearch}>
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="btn btn-ghost">Search</button>
        {search && (
          <button type="button" className="btn btn-ghost" onClick={() => { setSearch(''); load(1, ''); }}>
            Clear
          </button>
        )}
      </form>

      {/* ── Table ── */}
      <div className="card">
        {loading ? (
          <div className="empty-state">
            <div className="spinner" />
            <p>Loading students…</p>
          </div>
        ) : students.length === 0 ? (
          <div className="empty-state">
            <GraduationCap size={48} className="empty-icon" />
            <p>No students found</p>
            <button className="btn btn-primary" onClick={() => navigate('/students/new')}>
              Add the first student
            </button>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Enrolled</th>
                <th>Avg Marks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td className="text-muted">{s.id}</td>
                  <td>
                    <strong>{s.first_name} {s.last_name}</strong>
                    {s.phone && <div className="text-muted text-sm">{s.phone}</div>}
                  </td>
                  <td className="text-muted">{s.email}</td>
                  <td className="text-muted">{formatDate(s.enrollment_date)}</td>
                  <td>
                    {s.avg_marks != null ? (
                      <span className={`badge ${parseFloat(s.avg_marks) >= 50 ? 'badge-pass' : 'badge-fail'}`}>
                        {s.avg_marks}%
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    <div className="action-group">
                      <button className="icon-btn" title="View" onClick={() => navigate(`/students/${s.id}`)}>
                        <Eye size={15} />
                      </button>
                      <button className="icon-btn" title="Edit" onClick={() => navigate(`/students/${s.id}/edit`)}>
                        <Pencil size={15} />
                      </button>
                      <button
                        className="icon-btn icon-btn-danger"
                        title="Delete"
                        disabled={deleting === s.id}
                        onClick={() => handleDelete(s.id, `${s.first_name} ${s.last_name}`)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ── */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <span className="pagination-info">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="pagination-controls">
            <button
              className="btn btn-ghost btn-icon"
              disabled={pagination.page <= 1}
              onClick={() => load(pagination.page - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  className={`btn btn-ghost btn-icon ${p === pagination.page ? 'active' : ''}`}
                  onClick={() => load(p)}
                >
                  {p}
                </button>
              );
            })}
            <button
              className="btn btn-ghost btn-icon"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => load(pagination.page + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
