import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fetchStudent, addMark, deleteMark, fetchSubjects } from '../api';
import { ArrowLeft, Pencil, Trash2, Plus, X, BookOpen } from 'lucide-react';

function AddMarkModal({ studentId, subjects, onClose, onAdded }) {
  const [form, setForm] = useState({
    subject_id: '', marks: '', max_marks: 100, exam_type: 'Midterm',
    exam_date: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.subject_id) e.subject_id = 'Required';
    if (form.marks === '') e.marks = 'Required';
    else if (parseFloat(form.marks) < 0 || parseFloat(form.marks) > 100) e.marks = '0–100';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      await addMark(studentId, form);
      toast.success('Mark added');
      onAdded();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const f = (name, value) => setForm((p) => ({ ...p, [name]: value }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Mark</h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Subject <span className="req">*</span></label>
            <select
              className={`form-input ${errors.subject_id ? 'input-error' : ''}`}
              value={form.subject_id}
              onChange={(e) => f('subject_id', e.target.value)}
            >
              <option value="">Select subject…</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
            {errors.subject_id && <p className="form-error">{errors.subject_id}</p>}
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Marks <span className="req">*</span></label>
              <input type="number" min="0" max="100" step="0.01"
                className={`form-input ${errors.marks ? 'input-error' : ''}`}
                value={form.marks}
                onChange={(e) => f('marks', e.target.value)}
              />
              {errors.marks && <p className="form-error">{errors.marks}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Max Marks</label>
              <input type="number" min="1" step="1"
                className="form-input"
                value={form.max_marks}
                onChange={(e) => f('max_marks', e.target.value)}
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Exam Type</label>
              <select className="form-input" value={form.exam_type} onChange={(e) => f('exam_type', e.target.value)}>
                {['Midterm', 'Final', 'Quiz', 'Assignment', 'Project'].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Exam Date</label>
              <input type="date" className="form-input" value={form.exam_date}
                onChange={(e) => f('exam_date', e.target.value)} />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Add Mark'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent]   = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deletingMark, setDeletingMark] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, subRes] = await Promise.all([fetchStudent(id), fetchSubjects()]);
      setStudent(sRes.data);
      setSubjects(subRes.data);
    } catch (err) {
      toast.error(err.message);
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  const handleDeleteMark = async (markId) => {
    if (!window.confirm('Remove this mark?')) return;
    setDeletingMark(markId);
    try {
      await deleteMark(markId);
      toast.success('Mark removed');
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeletingMark(null);
    }
  };

  if (loading) return <div className="page"><div className="empty-state"><div className="spinner" /></div></div>;
  if (!student) return null;

  const marks  = student.marks || [];
  const passed = marks.filter((m) => parseFloat(m.marks) >= 50).length;
  const avgPct = marks.length
    ? (marks.reduce((s, m) => s + parseFloat(m.marks) / parseFloat(m.max_marks) * 100, 0) / marks.length).toFixed(1)
    : null;

  const fmt = (d) => d ? new Date(d).toLocaleDateString() : '—';

  return (
    <div className="page">
      {showModal && (
        <AddMarkModal
          studentId={id}
          subjects={subjects}
          onClose={() => setShowModal(false)}
          onAdded={load}
        />
      )}

      {/* ── Header ── */}
      <div className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Students
        </button>
        <button className="btn btn-secondary" onClick={() => navigate(`/students/${id}/edit`)}>
          <Pencil size={14} /> Edit
        </button>
      </div>

      {/* ── Profile card ── */}
      <div className="card student-profile">
        <div className="avatar">{student.first_name[0]}{student.last_name[0]}</div>
        <div>
          <h2 className="student-name">{student.first_name} {student.last_name}</h2>
          <p className="text-muted">{student.email}</p>
          {student.phone && <p className="text-muted">{student.phone}</p>}
        </div>
        <div className="profile-meta">
          <div className="meta-item">
            <span className="meta-label">Enrolled</span>
            <span>{fmt(student.enrollment_date)}</span>
          </div>
          {student.date_of_birth && (
            <div className="meta-item">
              <span className="meta-label">Date of Birth</span>
              <span>{fmt(student.date_of_birth)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{marks.length}</div>
          <div className="stat-label">Exams Recorded</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{avgPct != null ? `${avgPct}%` : '—'}</div>
          <div className="stat-label">Average Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{passed}</div>
          <div className="stat-label">Passed</div>
        </div>
      </div>

      {/* ── Marks ── */}
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={18} />
          <h3 className="section-title">Marks</h3>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          <Plus size={14} /> Add Mark
        </button>
      </div>

      <div className="card">
        {marks.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={40} className="empty-icon" />
            <p>No marks recorded yet</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>Add first mark</button>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Exam</th>
                <th>Date</th>
                <th>Score</th>
                <th>%</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {marks.map((m) => {
                const pct = ((parseFloat(m.marks) / parseFloat(m.max_marks)) * 100).toFixed(1);
                return (
                  <tr key={m.id}>
                    <td><strong>{m.subject_name}</strong> <span className="text-muted text-sm">({m.subject_code})</span></td>
                    <td><span className="badge badge-neutral">{m.exam_type}</span></td>
                    <td className="text-muted">{fmt(m.exam_date)}</td>
                    <td>{m.marks} / {m.max_marks}</td>
                    <td>
                      <span className={`badge ${parseFloat(pct) >= 50 ? 'badge-pass' : 'badge-fail'}`}>
                        {pct}%
                      </span>
                    </td>
                    <td>
                      <button
                        className="icon-btn icon-btn-danger"
                        disabled={deletingMark === m.id}
                        onClick={() => handleDeleteMark(m.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
