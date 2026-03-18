'use client';

import { useState, useEffect, useMemo } from 'react';

const BUSINESS_HOURS = { start: 10, end: 16 }; // 10:00-16:00
const TIME_SLOTS = Array.from(
  { length: BUSINESS_HOURS.end - BUSINESS_HOURS.start },
  (_, i) => {
    const h = BUSINESS_HOURS.start + i;
    return { value: h, label: `${h}:00` };
  }
);
const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

export default function Home() {
  const [view, setView] = useState('login');
  const [record, setRecord] = useState(null);
  const [recordId, setRecordId] = useState(null);
  const [reservationInput, setReservationInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [editPhone, setEditPhone] = useState('');
  const [editDate, setEditDate] = useState('');   // YYYY-MM-DD
  const [editHour, setEditHour] = useState('');    // e.g. "10"
  const [editProperty, setEditProperty] = useState('');
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [availabilityMsg, setAvailabilityMsg] = useState('');
  const [availabilityOk, setAvailabilityOk] = useState(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [completeMessage, setCompleteMessage] = useState('');

  // Dynamic property list from Google Sheets
  const [properties, setProperties] = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  // holidays: array of { date: 'YYYY-MM-DD', name: '...' }
  const [holidays, setHolidays] = useState([]);

  // Calendar navigation
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // Fetch properties from Google Sheets
  async function fetchProperties() {
    setPropertiesLoading(true);
    try {
      const res = await fetch('/api/properties');
      const data = await res.json();
      if (data.properties) {
        setProperties(data.properties);
      }
    } catch (err) {
      console.error('Failed to fetch properties:', err);
    } finally {
      setPropertiesLoading(false);
    }
  }

  // Fetch Japan holidays from the API route
  async function fetchHolidays() {
    try {
      const res = await fetch('/api/holidays');
      const data = await res.json();
      if (data.holidays) {
        // Support both old format (string[]) and new format ({date, name}[])
        if (typeof data.holidays[0] === 'string') {
          setHolidays(data.holidays.map(d => ({ date: d, name: '祝日' })));
        } else {
          setHolidays(data.holidays);
        }
      }
    } catch (err) {
      console.error('Failed to fetch holidays:', err);
    }
  }

  // Load properties and holidays on mount
  useEffect(() => {
    fetchProperties();
    fetchHolidays();
  }, []);

  // Holiday lookup map: 'YYYY-MM-DD' -> holiday name
  const holidayMap = useMemo(() => {
    const map = {};
    holidays.forEach(h => { map[h.date] = h.name; });
    return map;
  }, [holidays]);

  // --- Login ---
  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    if (!reservationInput.trim() || !phoneInput.trim()) {
      setLoginError('受付番号と電話番号を入力してください。');
      return;
    }
    setLoginLoading(true);
    try {
      const res = await fetch('/api/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId: reservationInput.trim(), phone: phoneInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || '予約が見つかりませんでした。');
        return;
      }
      setRecordId(data.recordId);
      setRecord(data.fields);
      setView('detail');
    } catch {
      setLoginError('エラーが発生しました。もう一度お試しください。');
    } finally {
      setLoginLoading(false);
    }
  }

  // --- Edit ---
  function openEdit() {
    setEditPhone(record?.['電話番号'] || '');
    setEditProperty(record?.['物件名'] || '');
    const dateVal = record?.['内見希望日時'] || '';
    if (dateVal) {
      try {
        const d = new Date(dateVal);
        // Convert to JST for display
        const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
        const yyyy = jst.getUTCFullYear();
        const mm = String(jst.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(jst.getUTCDate()).padStart(2, '0');
        setEditDate(`${yyyy}-${mm}-${dd}`);
        setEditHour(String(jst.getUTCHours()));
        // Always show current month first per user request
        const now = new Date();
        setCalendarMonth({ year: now.getFullYear(), month: now.getMonth() });
      } catch {
        setEditDate('');
        setEditHour('');
      }
    }
    setEditError('');
    setEditSuccess('');
    setAvailabilityMsg('');
    setAvailabilityOk(null);
    fetchProperties();
    setView('edit');
  }

  // Combine date + hour into ISO string in JST
  function buildDateTimeISO(dateStr, hourStr) {
    if (!dateStr || hourStr === '') return null;
    // dateStr = 'YYYY-MM-DD', hourStr = '10' etc.
    const [y, m, d] = dateStr.split('-').map(Number);
    const hour = Number(hourStr);
    // Construct JST date and convert to UTC ISO
    const jstDate = new Date(Date.UTC(y, m - 1, d, hour - 9, 0, 0));
    return jstDate.toISOString();
  }

  // --- Check availability when date, hour or property changes ---
  async function checkAvailability(property, dateStr, hourStr) {
    if (!property || !dateStr || hourStr === '') {
      setAvailabilityMsg('');
      setAvailabilityOk(null);
      return;
    }

    // Client-side validation: Holiday
    if (holidayMap[dateStr]) {
      setAvailabilityMsg(`⚠️ ${holidayMap[dateStr]}のため定休日です。`);
      setAvailabilityOk(false);
      return;
    }

    // Client-side validation: Wednesday
    const [y, m, d] = dateStr.split('-').map(Number);
    const dayObj = new Date(y, m - 1, d);
    if (dayObj.getDay() === 3) {
      setAvailabilityMsg('⚠️ 水曜日は定休日です。');
      setAvailabilityOk(false);
      return;
    }

    const isoDateTime = buildDateTimeISO(dateStr, hourStr);
    if (!isoDateTime) return;

    try {
      const res = await fetch('/api/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property,
          dateTime: isoDateTime,
          excludeRecordId: recordId,
        }),
      });
      const data = await res.json();
      if (data.available) {
        setAvailabilityMsg('✅ この時間帯は予約可能です。');
        setAvailabilityOk(true);
      } else {
        setAvailabilityMsg(`⚠️ ${data.reason}`);
        setAvailabilityOk(false);
      }
    } catch {
      setAvailabilityMsg('');
      setAvailabilityOk(null);
    }
  }

  function handleDateSelect(dateStr) {
    setEditDate(dateStr);
    checkAvailability(editProperty, dateStr, editHour);
  }

  function handleHourChange(val) {
    setEditHour(val);
    checkAvailability(editProperty, editDate, val);
  }

  function handlePropertyChange(val) {
    setEditProperty(val);
    if (editDate && editHour !== '') checkAvailability(val, editDate, editHour);
  }

  async function handleUpdate(e) {
    e.preventDefault();
    setEditError('');
    setEditSuccess('');
    const fields = {};
    if (editPhone.trim()) fields['電話番号'] = editPhone.trim();
    if (editDate && editHour !== '') {
      const iso = buildDateTimeISO(editDate, editHour);
      if (iso) fields['内見希望日時'] = iso;
    }
    if (editProperty.trim()) fields['物件名'] = editProperty.trim();
    if (Object.keys(fields).length === 0) {
      setEditError('変更する項目を入力してください。');
      return;
    }
    setEditLoading(true);
    try {
      const res = await fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId, fields }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || '更新に失敗しました。');
        return;
      }
      setRecord(data.fields);
      setEditSuccess('✅ 予約内容を更新しました！');
      setTimeout(() => setView('detail'), 1500);
    } catch {
      setEditError('エラーが発生しました。');
    } finally {
      setEditLoading(false);
    }
  }

  // --- Cancel ---
  function isSameDay() {
    const dateStr = record?.['内見希望日時'] || '';
    if (!dateStr) return false;
    const rDate = new Date(dateStr).toDateString();
    return rDate === new Date().toDateString();
  }

  async function handleCancel() {
    setCancelLoading(true);
    try {
      const res = await fetch('/api/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId }),
      });
      const data = await res.json();
      setShowCancelModal(false);
      if (!res.ok) {
        alert(data.error || 'キャンセルに失敗しました。');
        return;
      }
      setCompleteMessage('予約をキャンセルしました。');
      setView('complete');
    } catch {
      setShowCancelModal(false);
      alert('エラーが発生しました。');
    } finally {
      setCancelLoading(false);
    }
  }

  function resetToLogin() {
    setView('login');
    setRecord(null);
    setRecordId(null);
    setReservationInput('');
    setPhoneInput('');
    setLoginError('');
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('ja-JP', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return dateStr; }
  }

  // --- Calendar ---
  function getMinDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  function isDateDisabled(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const minDate = getMinDate();
    minDate.setHours(0, 0, 0, 0);

    // Past or today
    if (date < minDate) return { disabled: true, reason: 'past' };
    // Wednesday
    if (date.getDay() === 3) return { disabled: true, reason: '定休日' };
    // Holiday
    if (holidayMap[dateStr]) return { disabled: true, reason: holidayMap[dateStr] };
    return { disabled: false };
  }

  function getCalendarDays(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDow = firstDay.getDay(); // 0=Sunday

    const days = [];
    // Fill leading blanks
    for (let i = 0; i < startDow; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      days.push(`${year}-${mm}-${dd}`);
    }
    return days;
  }

  function prevMonth() {
    setCalendarMonth(prev => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { year: prev.year, month: prev.month - 1 };
    });
  }

  function nextMonth() {
    setCalendarMonth(prev => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { year: prev.year, month: prev.month + 1 };
    });
  }

  // Can we go to previous month? Prevent going before current month
  const canGoPrev = (() => {
    const now = new Date();
    return calendarMonth.year > now.getFullYear() ||
      (calendarMonth.year === now.getFullYear() && calendarMonth.month > now.getMonth());
  })();

  // Get property info for display
  function getPropertyInfo(name) {
    return properties.find(p => p['物件名'] === name);
  }

  // Calendar component
  function renderCalendar() {
    const { year, month } = calendarMonth;
    const days = getCalendarDays(year, month);
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

    return (
      <div className="calendar">
        <div className="calendar-header">
          <button
            type="button"
            className="calendar-nav"
            onClick={prevMonth}
            disabled={!canGoPrev}
            aria-label="前月"
          >
            ‹
          </button>
          <span className="calendar-title">{year}年 {monthNames[month]}</span>
          <button
            type="button"
            className="calendar-nav"
            onClick={nextMonth}
            aria-label="翌月"
          >
            ›
          </button>
        </div>
        <div className="calendar-weekdays">
          {DAY_LABELS.map((d, i) => (
            <div key={d} className={`calendar-weekday ${i === 0 ? 'sunday' : ''} ${i === 3 ? 'wednesday' : ''} ${i === 6 ? 'saturday' : ''}`}>
              {d}
            </div>
          ))}
        </div>
        <div className="calendar-grid">
          {days.map((dateStr, idx) => {
            if (dateStr === null) {
              return <div key={`blank-${idx}`} className="calendar-day blank" />;
            }
            const dayNum = parseInt(dateStr.split('-')[2], 10);
            const info = isDateDisabled(dateStr);
            const isSelected = dateStr === editDate;
            const isHoliday = !!holidayMap[dateStr];
            const [, , dStr] = dateStr.split('-');
            const dayOfWeek = new Date(parseInt(dateStr.split('-')[0]), parseInt(dateStr.split('-')[1]) - 1, dayNum).getDay();

            let className = 'calendar-day';
            if (info.disabled) className += ' disabled';
            if (isSelected) className += ' selected';
            if (isHoliday) className += ' holiday';
            if (dayOfWeek === 0) className += ' sunday';
            if (dayOfWeek === 3) className += ' wednesday';
            if (dayOfWeek === 6) className += ' saturday';

            return (
              <button
                key={dateStr}
                type="button"
                className={className}
                disabled={info.disabled}
                onClick={() => handleDateSelect(dateStr)}
                title={info.disabled && info.reason !== 'past' ? info.reason : undefined}
              >
                <span className="day-number">{dayNum}</span>
                {isHoliday && <span className="holiday-dot" title={holidayMap[dateStr]} />}
                {info.disabled && info.reason === '定休日' && <span className="closed-dot" />}
              </button>
            );
          })}
        </div>
        <div className="calendar-legend">
          <span className="legend-item"><span className="legend-dot holiday-dot-legend" /> 祝日</span>
          <span className="legend-item"><span className="legend-dot closed-dot-legend" /> 定休日（水曜）</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      <div className="card">

        {/* ===== LOGIN ===== */}
        {view === 'login' && (
          <>
            <div className="card-header">
              <h1>🏠 若葉ホームズ</h1>
              <p className="subtitle">内見予約 変更・キャンセル</p>
              <p>受付番号と電話番号でログインしてください</p>
            </div>
            <div className="card-body">
              <form onSubmit={handleLogin}>
                <div className="field">
                  <label htmlFor="resId">📌 受付番号</label>
                  <input id="resId" type="text" placeholder="例: RSV-20260223-1234"
                    value={reservationInput} onChange={e => setReservationInput(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="phone">📞 電話番号</label>
                  <input id="phone" type="tel" placeholder="例: 090-1234-5678"
                    value={phoneInput} onChange={e => setPhoneInput(e.target.value)} />
                </div>
                {loginError && <div className="alert alert-danger">{loginError}</div>}
                <button className="btn btn-primary" type="submit" disabled={loginLoading}>
                  {loginLoading ? <><span className="spinner" /> 検索中...</> : 'ログイン'}
                </button>
              </form>
            </div>
          </>
        )}

        {/* ===== DETAIL ===== */}
        {view === 'detail' && record && (
          <>
            <div className="card-header">
              <h1>📋 ご予約内容</h1>
              <p>受付番号: {record['受付番号']}</p>
            </div>
            <div className="card-body">
              <div className="info-card">
                <div className="info-row">
                  <span className="label">受付番号</span>
                  <span className="value">{record['受付番号'] || '—'}</span>
                </div>
                <div className="info-row">
                  <span className="label">お名前</span>
                  <span className="value">{record['氏名'] || '—'}</span>
                </div>
                <div className="info-row">
                  <span className="label">電話番号</span>
                  <span className="value">{record['電話番号'] || '—'}</span>
                </div>
                <div className="info-row">
                  <span className="label">メールアドレス</span>
                  <span className="value">{record['メールアドレス'] || '—'}</span>
                </div>
                <div className="info-row">
                  <span className="label">物件名</span>
                  <span className="value">{record['物件名'] || '—'}</span>
                </div>
                <div className="info-row">
                  <span className="label">内見希望日時</span>
                  <span className="value">{formatDate(record['内見希望日時'])}</span>
                </div>
                <div className="info-row">
                  <span className="label">ステータス</span>
                  <span className="value">
                    <span className={`status-badge ${record['ステータス'] === '予約中' ? 'status-active' : 'status-cancelled'}`}>
                      {record['ステータス'] || '—'}
                    </span>
                  </span>
                </div>
              </div>
              <button className="btn btn-primary" onClick={openEdit}>✏️ 予約内容を変更</button>
              <button className="btn btn-danger" onClick={() => setShowCancelModal(true)}>🗑️ 予約をキャンセル</button>
              <button className="back-link" onClick={resetToLogin}>← ログイン画面に戻る</button>
            </div>
          </>
        )}

        {/* ===== EDIT ===== */}
        {view === 'edit' && (
          <>
            <div className="card-header">
              <h1>✏️ 予約内容の変更</h1>
              <p>変更したい項目を修正してください</p>
            </div>
            <div className="card-body">
              <div className="alert alert-warning">⚠️ 変更可能な項目は<strong>電話番号・内見日時・物件</strong>です。</div>
              <div className="alert alert-info">📅 内見対応: 10:00〜16:00（水曜・祝日休み）/ 1時間につき1組のみ</div>
              <form onSubmit={handleUpdate}>
                <div className="field">
                  <label htmlFor="editPhone">📞 電話番号</label>
                  <input id="editPhone" type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} />
                </div>
                <div className="field">
                  <label>📅 内見希望日</label>
                  {renderCalendar()}
                  {editDate && (
                    <div className="selected-date-display">
                      選択中: <strong>{editDate.replace(/-/g, '/')}</strong>
                    </div>
                  )}
                </div>
                <div className="field">
                  <label htmlFor="editHour">🕐 希望時間</label>
                  <select
                    id="editHour"
                    value={editHour}
                    onChange={e => handleHourChange(e.target.value)}
                  >
                    <option value="">時間を選択してください</option>
                    {TIME_SLOTS.map(slot => (
                      <option key={slot.value} value={slot.value}>
                        {slot.label}〜{slot.value + 1}:00
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="editProp">🏠 物件名</label>
                  {propertiesLoading ? (
                    <div className="loading-text"><span className="spinner spinner-sm" /> 物件データ読み込み中...</div>
                  ) : (
                    <select
                      id="editProp"
                      value={editProperty}
                      onChange={e => handlePropertyChange(e.target.value)}
                    >
                      <option value="">物件を選択してください</option>
                      {properties.map(p => (
                        <option key={p['物件ID'] || p['物件名']} value={p['物件名']}>
                          {p['物件名']} - {p['エリア']} / {p['家賃']} / {p['間取り']} {p['状況'] === '満室' ? '(満室)' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  {editProperty && getPropertyInfo(editProperty) && (
                    <div className="property-detail">
                      <span>📍 {getPropertyInfo(editProperty)['エリア']}</span>
                      <span>💰 {getPropertyInfo(editProperty)['家賃']}</span>
                      <span>🏗 {getPropertyInfo(editProperty)['間取り']}</span>
                    </div>
                  )}
                </div>
                {availabilityMsg && (
                  <div className={`alert ${availabilityOk ? 'alert-success' : 'alert-danger'}`}>
                    {availabilityMsg}
                  </div>
                )}
                {editError && <div className="alert alert-danger">{editError}</div>}
                {editSuccess && <div className="alert alert-success">{editSuccess}</div>}
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={editLoading || availabilityOk === false}
                >
                  {editLoading ? <><span className="spinner" /> 保存中...</> : '💾 変更を保存'}
                </button>
                <button className="btn btn-outline" type="button" onClick={() => setView('detail')}>← 戻る</button>
              </form>
            </div>
          </>
        )}

        {/* ===== COMPLETE ===== */}
        {view === 'complete' && (
          <>
            <div className="card-header">
              <h1>✅ 処理完了</h1>
            </div>
            <div className="card-body">
              <div className="alert alert-success">{completeMessage}</div>
              <button className="btn btn-primary" onClick={resetToLogin}>ログイン画面に戻る</button>
            </div>
          </>
        )}
      </div>

      {/* ===== CANCEL MODAL ===== */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>⚠️ 予約キャンセルの確認</h3>
            <p>この予約をキャンセルしますか？<br />この操作は取り消せません。</p>
            {isSameDay() && (
              <div className="alert alert-danger" style={{ marginBottom: 16 }}>
                ⚠️ <strong>当日キャンセル</strong>となります。当日キャンセルはお控えいただきますようお願いいたします。
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowCancelModal(false)}>戻る</button>
              <button className="btn btn-danger" onClick={handleCancel} disabled={cancelLoading}>
                {cancelLoading ? <span className="spinner" /> : 'キャンセルする'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
