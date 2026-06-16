import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fetchStudent, createStudent, updateStudent } from '../api';
import { ArrowLeft, Save } from 'lucide-react';

const EMPTY = {
  first_name: '', last_name: '', email: '',
  phone: '', date_of_birth: '', enrollment_date: new Date().toISOString().slice(0, 10),
};

function validate(data) {
  const errs = {};
  if (!data.first_name.trim()) errs.first_name = 'Required';
  if (!data.last_name.trim())  errs.last_name  = 'Required';
  if (!data.email.trim()) {
    errs.email = 'Required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errs.email = 'Invalid email';
  }
  if (data.phone && !/^[+\d\s\-()]{7,20}$/.test(data.phone)) {
    errs.phone = 'Invalid phone number';
  }
  return errs;
}

export default function StudentForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm]       = useState(EMPTY);
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    fetchStudent(id)
      .then((res) => {
        const s = res.data;
        setForm({
          first_name:      s.first_name,
          last_name:       s.last_name,
          email:           s.email,
          phone:           s.phone || '',
          date_of_birth:   s.date_of_birth ? s.date_of_birth.slice(0, 10) : '',
          enrollment_date: s.enrollment_date ? s.enrollment_date.slice(0, 10) : '',
        });
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      if (isEdit) {
        await updateStudent(id, form);
        toast.success('Student updated');
        navigate(`/students/${id}`);
      } else {
        const res = await createStudent(form);
        toast.success('Student created');
        navigate(`/students/${res.data.id}`);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="page"><div className="empty-state"><div className="spinner" /></div></div>
  );

  const field = (label, name, type = 'text', required = false) => (
    <div className="form-group">
      <label className="form-label">{label}{required && <span className="req"> *</span>}</label>
      <input
        type={type}
        name={name}
        value={form[name]}
        onChange={handleChange}
        className={`form-input ${errors[name] ? 'input-error' : ''}`}
      />
      {errors[name] && <p className="form-error">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="page page-narrow">
      <div className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="page-title">{isEdit ? 'Edit Student' : 'Add Student'}</h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {field('First Name', 'first_name', 'text', true)}
            {field('Last Name', 'last_name', 'text', true)}
          </div>
          {field('Email Address', 'email', 'email', true)}
          {field('Phone', 'phone', 'tel')}
          <div className="form-grid">
            {field('Date of Birth', 'date_of_birth', 'date')}
            {field('Enrollment Date', 'enrollment_date', 'date')}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={15} /> {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
