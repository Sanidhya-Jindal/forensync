import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../api';

function ReportMissingPerson() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fir_number: '',
    police_station: '',
    reported_date: new Date().toISOString().slice(0, 16),
    reporter_name: '',
    reporter_contact: '',
    name: '',
    gender: 'Unknown',
    age: '',
    height_cm: '',
    build: 'Unknown',
    hair_color: '',
    eye_color: '',
    distinguishing_marks: '',
    last_seen_date: '',
    last_seen_address: '',
    clothing_description: '',
    person_description: '',
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) data.append(key, value);
      });
      if (photo) data.append('profile_photo', photo);

      const response = await apiService.reportMissingPerson(data);
      setSuccess(response.data);
      setFormData({
        fir_number: '',
        police_station: '',
        reported_date: new Date().toISOString().slice(0, 16),
        reporter_name: '',
        reporter_contact: '',
        name: '',
        gender: 'Unknown',
        age: '',
        height_cm: '',
        build: 'Unknown',
        hair_color: '',
        eye_color: '',
        distinguishing_marks: '',
        last_seen_date: '',
        last_seen_address: '',
        clothing_description: '',
        person_description: '',
      });
      setPhoto(null);
      setPhotoPreview('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-4 max-w-4xl">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-sm mb-6 transition-colors hover:text-white"
        style={{ color: '#9B9B9B' }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <p className="label-warp mb-4">REPORT</p>
      <h1 className="text-4xl font-medium text-white mb-2">Missing Person</h1>
      <p className="mb-8" style={{ color: '#9B9B9B' }}>
        File a missing person report for identification matching.
      </p>

      {success && (
        <div className="card-warp p-4 mb-6" style={{ borderColor: 'rgba(16,185,129,0.5)' }}>
          <p className="text-emerald-400 font-medium">Report Submitted Successfully!</p>
          <p className="mt-1" style={{ color: '#9B9B9B' }}>PID: {success.data?.pid || 'Generated'}</p>
          <button onClick={() => setSuccess(null)} className="text-sm mt-2 hover:underline" style={{ color: '#F87171' }}>
            Submit another report →
          </button>
        </div>
      )}

      {error && (
        <div className="card-warp p-4 mb-6" style={{ borderColor: 'rgba(239,68,68,0.5)' }}>
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Case Information */}
        <div className="card-warp p-6">
          <p className="label-warp mb-4">CASE INFORMATION</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2" style={{ color: '#9B9B9B' }}>FIR Number *</label>
              <input type="text" name="fir_number" value={formData.fir_number} onChange={handleChange} required className="input-warp" />
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: '#9B9B9B' }}>Police Station *</label>
              <input type="text" name="police_station" value={formData.police_station} onChange={handleChange} required className="input-warp" />
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: '#9B9B9B' }}>Reported Date *</label>
              <input type="datetime-local" name="reported_date" value={formData.reported_date} onChange={handleChange} required className="input-warp" />
            </div>
          </div>
        </div>

        {/* Reporter Information */}
        <div className="card-warp p-6">
          <p className="label-warp mb-4">REPORTER INFORMATION</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2" style={{ color: '#9B9B9B' }}>Reporter Name</label>
              <input type="text" name="reporter_name" value={formData.reporter_name} onChange={handleChange} className="input-warp" />
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: '#9B9B9B' }}>Reporter Contact</label>
              <input type="tel" name="reporter_contact" value={formData.reporter_contact} onChange={handleChange} className="input-warp" />
            </div>
          </div>
        </div>

        {/* Missing Person Details */}
        <div className="card-warp p-6">
          <p className="label-warp mb-4">MISSING PERSON DETAILS</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-2" style={{ color: '#9B9B9B' }}>Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="input-warp" />
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: '#9B9B9B' }}>Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="input-warp">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: '#9B9B9B' }}>Age</label>
              <input type="number" name="age" value={formData.age} onChange={handleChange} className="input-warp" />
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: '#9B9B9B' }}>Height (cm)</label>
              <input type="number" name="height_cm" value={formData.height_cm} onChange={handleChange} className="input-warp" />
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: '#9B9B9B' }}>Build</label>
              <select name="build" value={formData.build} onChange={handleChange} className="input-warp">
                <option value="Slim">Slim</option>
                <option value="Medium">Medium</option>
                <option value="Heavy">Heavy</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: '#9B9B9B' }}>Hair Color</label>
              <input type="text" name="hair_color" value={formData.hair_color} onChange={handleChange} className="input-warp" />
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: '#9B9B9B' }}>Eye Color</label>
              <input type="text" name="eye_color" value={formData.eye_color} onChange={handleChange} className="input-warp" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm mb-2" style={{ color: '#9B9B9B' }}>Distinguishing Marks</label>
            <textarea name="distinguishing_marks" value={formData.distinguishing_marks} onChange={handleChange} rows={2} className="input-warp" />
          </div>
        </div>

        {/* Last Seen Information */}
        <div className="card-warp p-6">
          <p className="label-warp mb-4">LAST SEEN INFORMATION</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2" style={{ color: '#9B9B9B' }}>Last Seen Date</label>
              <input type="datetime-local" name="last_seen_date" value={formData.last_seen_date} onChange={handleChange} className="input-warp" />
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: '#9B9B9B' }}>Last Seen Address</label>
              <input type="text" name="last_seen_address" value={formData.last_seen_address} onChange={handleChange} className="input-warp" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm mb-2" style={{ color: '#9B9B9B' }}>Clothing Description</label>
            <textarea name="clothing_description" value={formData.clothing_description} onChange={handleChange} rows={2} className="input-warp" />
          </div>
          <div className="mt-4">
            <label className="block text-sm mb-2" style={{ color: '#9B9B9B' }}>Person Description</label>
            <textarea name="person_description" value={formData.person_description} onChange={handleChange} rows={3} className="input-warp" />
          </div>
        </div>

        {/* Photo Upload */}
        <div className="card-warp p-6">
          <p className="label-warp mb-4">PHOTO UPLOAD</p>
          <div className="flex items-start gap-6">
            <div className="flex-1">
              <label className="block text-sm mb-2" style={{ color: '#9B9B9B' }}>Profile Photo</label>
              <input type="file" accept="image/*" onChange={handlePhotoChange} className="input-warp" />
              <p className="text-xs mt-2" style={{ color: '#717171' }}>Upload a recent photo for better matching accuracy</p>
            </div>
            {photoPreview && (
              <div className="w-24 h-24 rounded-lg overflow-hidden" style={{ border: '1px solid #333333' }}>
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>

        <button type="submit" disabled={submitting} className="btn-warp-orange w-full py-3 disabled:opacity-50">
          {submitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}

export default ReportMissingPerson;
