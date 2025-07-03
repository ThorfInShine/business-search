import React, { useState, useEffect } from 'react'
import { businessService } from '../services/businessService'
import './BusinessForm.css'

const BusinessForm = ({ business = null, onSave, onCancel, kecamatanList = [], desaList = [] }) => {
  const [formData, setFormData] = useState({
    nama_usaha: '',
    alamat: '',
    rt: '',
    rw: '',
    dusun: '',
    propinsi: 'Jawa Timur',
    kabupaten: 'Malang',
    kecamatan: '',
    desa: '',
    no_telp: '',
    email: '',
    website: '',
    jenis_usaha: '',
    kbli: '',
    kegiatan: '',
    status_toko: 'BUKA',
    nama_petugas: '',
    latitude: '',
    longitude: '',
    jam_operasional: '',
    tahun_berdiri: '',
    jumlah_karyawan: '',
    omzet: '',
    modal: '',
    keuntungan: '',
    deskripsi: ''
  })
  
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  // Populate form if editing
  useEffect(() => {
    if (business) {
      setFormData({
        nama_usaha: business.nama_usaha || '',
        alamat: business.alamat || '',
        rt: business.rt || '',
        rw: business.rw || '',
        dusun: business.dusun || '',
        propinsi: business.propinsi || 'Jawa Timur',
        kabupaten: business.kabupaten || 'Malang',
        kecamatan: business.kecamatan || '',
        desa: business.desa || '',
        no_telp: business.no_telp || '',
        email: business.email || '',
        website: business.website || '',
        jenis_usaha: business.jenis_usaha || '',
        kbli: business.kbli || '',
        kegiatan: business.kegiatan || '',
        status_toko: business.status_toko || 'BUKA',
        nama_petugas: business.nama_petugas || '',
        latitude: business.latitude || '',
        longitude: business.longitude || '',
        jam_operasional: business.jam_operasional || '',
        tahun_berdiri: business.tahun_berdiri || '',
        jumlah_karyawan: business.jumlah_karyawan || '',
        omzet: business.omzet || '',
        modal: business.modal || '',
        keuntungan: business.keuntungan || '',
        deskripsi: business.deskripsi || ''
      })
    }
  }, [business])

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.nama_usaha.trim()) {
      newErrors.nama_usaha = 'Nama usaha wajib diisi'
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid'
    }
    
    if (formData.website && !formData.website.startsWith('http')) {
      // Auto-fix website URL
      setFormData(prev => ({
        ...prev,
        website: `https://${prev.website}`
      }))
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setSaving(true)
    
    try {
      let result
      if (business) {
        // Update existing
        result = await businessService.updateBusiness(business.id, formData)
        console.log('✅ Business updated:', result.nama_usaha)
      } else {
        // Create new
        result = await businessService.createBusiness(formData)
        console.log('✅ Business created:', result.nama_usaha)
      }
      
      onSave(result)
    } catch (error) {
      console.error('Error saving business:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  return (
    <div className="business-form-overlay">
      <div className="business-form-container">
        <div className="form-header">
          <h2>{business ? '✏️ Edit Usaha' : '➕ Tambah Usaha Baru'}</h2>
          <button onClick={onCancel} className="close-btn">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="business-form">
          <div className="form-sections">
            {/* Informasi Dasar */}
            <div className="form-section">
              <h3>🏢 Informasi Dasar</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Nama Usaha *</label>
                  <input
                    type="text"
                    value={formData.nama_usaha}
                    onChange={(e) => handleChange('nama_usaha', e.target.value)}
                    className={errors.nama_usaha ? 'error' : ''}
                    required
                  />
                  {errors.nama_usaha && <span className="error-text">{errors.nama_usaha}</span>}
                </div>

                <div className="form-group">
                  <label>Jenis Usaha</label>
                  <input
                    type="text"
                    value={formData.jenis_usaha}
                    onChange={(e) => handleChange('jenis_usaha', e.target.value)}
                    placeholder="Contoh: Warung Makan, Toko Kelontong"
                  />
                </div>

                <div className="form-group">
                  <label>Kode KBLI</label>
                  <input
                    type="text"
                    value={formData.kbli}
                    onChange={(e) => handleChange('kbli', e.target.value)}
                    placeholder="Contoh: 47111"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Kegiatan Usaha</label>
                  <textarea
                    value={formData.kegiatan}
                    onChange={(e) => handleChange('kegiatan', e.target.value)}
                    placeholder="Jelaskan kegiatan utama usaha..."
                    rows="3"
                  />
                </div>
              </div>
            </div>

            {/* Lokasi */}
            <div className="form-section">
              <h3>📍 Alamat & Lokasi</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Alamat</label>
                  <textarea
                    value={formData.alamat}
                    onChange={(e) => handleChange('alamat', e.target.value)}
                    placeholder="Alamat lengkap usaha..."
                    rows="2"
                  />
                </div>

                <div className="form-group">
                  <label>RT</label>
                  <input
                    type="text"
                    value={formData.rt}
                    onChange={(e) => handleChange('rt', e.target.value)}
                    placeholder="001"
                  />
                </div>

                <div className="form-group">
                  <label>RW</label>
                  <input
                    type="text"
                    value={formData.rw}
                    onChange={(e) => handleChange('rw', e.target.value)}
                    placeholder="001"
                  />
                </div>

                <div className="form-group">
                  <label>Dusun</label>
                  <input
                    type="text"
                    value={formData.dusun}
                    onChange={(e) => handleChange('dusun', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Kecamatan</label>
                  <select
                    value={formData.kecamatan}
                    onChange={(e) => handleChange('kecamatan', e.target.value)}
                  >
                    <option value="">Pilih Kecamatan</option>
                    {kecamatanList.map(kec => (
                      <option key={kec} value={kec}>{kec}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Desa/Kelurahan</label>
                  <select
                    value={formData.desa}
                    onChange={(e) => handleChange('desa', e.target.value)}
                  >
                    <option value="">Pilih Desa</option>
                    {desaList.map(desa => (
                      <option key={desa} value={desa}>{desa}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => handleChange('latitude', e.target.value)}
                    placeholder="-7.9666"
                  />
                </div>

                <div className="form-group">
                  <label>Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => handleChange('longitude', e.target.value)}
                    placeholder="112.6326"
                  />
                </div>
              </div>
            </div>

            {/* Kontak */}
            <div className="form-section">
              <h3>📞 Informasi Kontak</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nomor Telepon</label>
                  <input
                    type="tel"
                    value={formData.no_telp}
                    onChange={(e) => handleChange('no_telp', e.target.value)}
                    placeholder="08123456789"
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={errors.email ? 'error' : ''}
                    placeholder="usaha@example.com"
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label>Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    placeholder="www.usaha.com"
                  />
                </div>

                <div className="form-group">
                  <label>Jam Operasional</label>
                  <input
                    type="text"
                    value={formData.jam_operasional}
                    onChange={(e) => handleChange('jam_operasional', e.target.value)}
                    placeholder="08:00 - 17:00"
                  />
                </div>
              </div>
            </div>

            {/* Status & Petugas */}
            <div className="form-section">
              <h3>📊 Status & Petugas</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Status Toko</label>
                  <select
                    value={formData.status_toko}
                    onChange={(e) => handleChange('status_toko', e.target.value)}
                  >
                    <option value="BUKA">BUKA</option>
                    <option value="TUTUP">TUTUP</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Nama Petugas</label>
                  <input
                    type="text"
                    value={formData.nama_petugas}
                    onChange={(e) => handleChange('nama_petugas', e.target.value)}
                    placeholder="Nama enumerator/surveyor"
                  />
                </div>

                <div className="form-group">
                  <label>Tahun Berdiri</label>
                  <input
                    type="number"
                    value={formData.tahun_berdiri}
                    onChange={(e) => handleChange('tahun_berdiri', e.target.value)}
                    placeholder="2020"
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>

                <div className="form-group">
                  <label>Jumlah Karyawan</label>
                  <input
                    type="text"
                    value={formData.jumlah_karyawan}
                    onChange={(e) => handleChange('jumlah_karyawan', e.target.value)}
                    placeholder="1-5 orang"
                  />
                </div>
              </div>
            </div>

            {/* Informasi Finansial */}
            <div className="form-section">
              <h3>💰 Informasi Finansial</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Omzet</label>
                  <input
                    type="text"
                    value={formData.omzet}
                    onChange={(e) => handleChange('omzet', e.target.value)}
                    placeholder="< 300 juta/tahun"
                  />
                </div>

                <div className="form-group">
                  <label>Modal</label>
                  <input
                    type="text"
                    value={formData.modal}
                    onChange={(e) => handleChange('modal', e.target.value)}
                    placeholder="< 50 juta"
                  />
                </div>

                <div className="form-group">
                  <label>Keuntungan</label>
                  <input
                    type="text"
                    value={formData.keuntungan}
                    onChange={(e) => handleChange('keuntungan', e.target.value)}
                    placeholder="10-50 juta/tahun"
                  />
                </div>
              </div>
            </div>

            {/* Deskripsi */}
            <div className="form-section">
              <h3>📝 Deskripsi</h3>
              <div className="form-group full-width">
                <label>Deskripsi Usaha</label>
                <textarea
                  value={formData.deskripsi}
                  onChange={(e) => handleChange('deskripsi', e.target.value)}
                  placeholder="Deskripsi lengkap tentang usaha..."
                  rows="4"
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="cancel-btn">
              Batal
            </button>
            <button type="submit" disabled={saving} className="save-btn">
              {saving ? '⏳ Menyimpan...' : (business ? '💾 Update' : '💾 Simpan')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BusinessForm