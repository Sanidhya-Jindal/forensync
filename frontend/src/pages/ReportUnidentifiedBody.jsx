import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../api';

function ReportUnidentifiedBody() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    police_station: '',
    found_date: new Date().toISOString().slice(0, 16),
    gender: 'Unknown',
    estimated_age: '',
    height_cm: '',
    build: 'Unknown',
    complexion: '',
    hair_color: '',
    eye_color: '',
    distinguishing_marks: '',
    clothing_description: '',
    person_description: '',
    found_address: '',
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

      const response = await apiService.reportUnidentifiedBody(data);
      setSuccess(response.data);
      setFormData({
        police_station: '',
        found_date: new Date().toISOString().slice(0, 16),
        gender: 'Unknown',
        estimated_age: '',
        height_cm: '',
        build: 'Unknown',
        complexion: '',
        hair_color: '',
        eye_color: '',
        distinguishing_marks: '',
        clothing_description: '',
        person_description: '',
        found_address: '',
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
      <h1 className="text-4xl font-medium text-white mb-2">Unidentified Body</h1>
      <p className="mb-8" style={{ color: '#9B9B9B' }}>
        Submit details about an unidentified body for identification matching.
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
              <label className="block text-sm mb-2" style={{ color: '#9B9B9B' }}>Police Station *</label>
              <input type="text" name="police_station" value={formData.police_station} onChange={handleChange} required className="input-warp" />
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: '#9B9B9B' }}>Found Date *</label>
              <input type="datetime-local" name="found_date" value={formData.found_date} onChange={handleChange} required className="input-warp" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-2" style={{ color: '#9B9B9B' }}>Found Address</label>
              <input type="text" name="found_address" value={formData.found_address} onChange={handleChange} className="input-warp" />
            </div>
          </div>
        </div>

        {/* Physical Description */}
        <div className="card-warp p-6">
          <p className="label-warp mb-4">PHYSICAL DESCRIPTION</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-2" style={{ color: '#9B9B9B' }}>Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="input-warp">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: '#9B9B9B' }}>Estimated Age</label>
              <input type="number" name="estimated_age" value={formData.estimated_age} onChange={handleChange} className="input-warp" />
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
              <label className="block text-sm mb-2" style={{ color: '#9B9B9B' }}>Complexion</label>
              <input type="text" name="complexion" value={formData.complexion} onChange={handleChange} className="input-warp" />
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
              <p className="text-xs mt-2" style={{ color: '#717171' }}>Upload a clear photo for facial recognition matching</p>
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

export default ReportUnidentifiedBody;
