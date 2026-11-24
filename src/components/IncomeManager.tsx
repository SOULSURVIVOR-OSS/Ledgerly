import React, { useState, useMemo } from 'react';
import {
  Plus,
  TrendingUp,
  Search,
  CheckSquare,
  Square,
  MoreVertical,
  Edit2,
  Trash2,
  Calendar,
  DollarSign,
  User,
  Tag,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import {
  calculateStreamTotal,
  formatCurrency,
  getCurrentMonthStr,
  isDateInFilter,
} from '../utils/finance';
import { IncomeEntry, IncomeStream } from '../types/finance';

export const IncomeManager: React.FC = () => {
  const {
    streams,
    incomeEntries,
    addStream,
    updateStream,
    deleteStream,
    addIncomeEntry,
    updateIncomeEntry,
    deleteIncomeEntry,
    toggleIncomeEntry,
    toggleAllIncomeInStream,
    settings,
    dateFilter,
  } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isAddStreamOpen, setIsAddStreamOpen] = useState(false);
  const [editingStream, setEditingStream] = useState<IncomeStream | null>(null);
  const [streamNameInput, setStreamNameInput] = useState('');
  const [streamColorInput, setStreamColorInput] = useState('#10b981');

  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<IncomeEntry | null>(null);
  const [clientFormStreamId, setClientFormStreamId] = useState('');
  const [clientFormName, setClientFormName] = useState('');
  const [clientFormAmount, setClientFormAmount] = useState('');
  const [clientFormDate, setClientFormDate] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    return today;
  });
  const [clientFormChecked, setClientFormChecked] = useState(true);
  const [clientFormNotes, setClientFormNotes] = useState('');

  // Delete confirmations
  const [deletingStreamId, setDeletingStreamId] = useState<string | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

  // Filter entries according to dateFilter
  const filteredEntries = useMemo(() => {
    return incomeEntries.filter((entry) => isDateInFilter(entry.date, dateFilter));
  }, [incomeEntries, dateFilter]);

  // Overall selected income total
  const overallSelectedIncome = useMemo(() => {
    return filteredEntries
      .filter((e) => e.isChecked)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [filteredEntries]);

  // Handle open Add Stream Modal
  const handleOpenAddStream = () => {
    setStreamNameInput('');
    setStreamColorInput('#10b981');
    setIsAddStreamOpen(true);
  };

  // Handle Save Stream (Add or Edit)
  const handleSaveStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamNameInput.trim()) return;

    if (editingStream) {
      updateStream(editingStream.id, streamNameInput, streamColorInput);
      setEditingStream(null);
    } else {
      addStream(streamNameInput, streamColorInput);
      setIsAddStreamOpen(false);
    }
    setStreamNameInput('');
  };

  // Handle open Add Client Modal
  const handleOpenAddClient = (streamId?: string) => {
    const defaultStreamId = streamId || (streams.length > 0 ? streams[0].id : '');
    setClientFormStreamId(defaultStreamId);
    setClientFormName('');
    setClientFormAmount('');
    setClientFormDate(() => {
      // Default to current date or selected month if applicable
      const now = new Date();
      return now.toISOString().split('T')[0];
    });
    setClientFormChecked(true);
    setClientFormNotes('');
    setEditingClient(null);
    setIsAddClientOpen(true);
  };

  // Handle open Edit Client Modal
  const handleOpenEditClient = (client: IncomeEntry) => {
    setEditingClient(client);
    setClientFormStreamId(client.streamId);
    setClientFormName(client.clientName);
    setClientFormAmount(client.amount.toString());
    setClientFormDate(client.date);
    setClientFormChecked(client.isChecked);
    setClientFormNotes(client.notes || '');
    setIsAddClientOpen(true);
  };

  // Handle Save Client (Add or Edit)
  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(clientFormAmount);
    if (!clientFormName.trim() || isNaN(amountNum) || amountNum < 0 || !clientFormStreamId) {
      return;
    }

    if (editingClient) {
      updateIncomeEntry(editingClient.id, {
        streamId: clientFormStreamId,
        clientName: clientFormName.trim(),
        amount: amountNum,
        date: clientFormDate,
        isChecked: clientFormChecked,
        notes: clientFormNotes.trim(),
      });
    } else {
      addIncomeEntry({
        streamId: clientFormStreamId,
        clientName: clientFormName.trim(),
        amount: amountNum,
        date: clientFormDate,
        isChecked: clientFormChecked,
        notes: clientFormNotes.trim(),
      });
    }
    setIsAddClientOpen(false);
    setEditingClient(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-4 h-4" />
            <span>Active Income Engine</span>
          </div>
          <div className="flex items-baseline gap-3 mt-1">
            <h2 className="text-3xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white">
              {formatCurrency(overallSelectedIncome, settings.currency)}
            </h2>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              from selected clients
            </span>
          </div>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
            Checkbox-based calculation: toggling any client instantly updates totals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleOpenAddStream}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stream</span>
          </button>
          <button
            onClick={() => handleOpenAddClient()}
            disabled={streams.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Client / Entry</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search stream or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
          <span>
            {streams.length} {streams.length === 1 ? 'stream' : 'streams'}
          </span>
          <span>•</span>
          <span>
            {filteredEntries.length} {filteredEntries.length === 1 ? 'client entry' : 'client entries'}
          </span>
        </div>
      </div>

      {/* Streams list */}
      {streams.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-neutral-900 border border-dashed border-neutral-300 dark:border-neutral-700">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
            No Income Streams Yet
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
            Create your first income stream (e.g. Freelancing, Consulting, Salary, or SaaS) to start organizing clients.
          </p>
          <button
            onClick={handleOpenAddStream}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Income Stream</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {streams.map((stream) => {
            const streamClients = filteredEntries.filter((e) => e.streamId === stream.id);
            const matchingClients = searchQuery.trim()
              ? streamClients.filter(
                  (c) =>
                    c.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    stream.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
              : streamClients;

            if (searchQuery.trim() && matchingClients.length === 0 && !stream.name.toLowerCase().includes(searchQuery.toLowerCase())) {
              return null;
            }

            const streamTotal = calculateStreamTotal(stream.id, filteredEntries);
            const allChecked = streamClients.length > 0 && streamClients.every((c) => c.isChecked);
            const someChecked = streamClients.some((c) => c.isChecked);

            return (
              <div
                key={stream.id}
                className="overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xs"
              >
                {/* Stream Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-800/20 gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: stream.color || '#10b981' }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                          {stream.name}
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium">
                          {streamClients.length} {streamClients.length === 1 ? 'client' : 'clients'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        Stream Total:{' '}
                        <span className="font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(streamTotal, settings.currency)}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Stream Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {/* Toggle All Checkbox */}
                    {streamClients.length > 0 && (
                      <button
                        onClick={() => toggleAllIncomeInStream(stream.id, !allChecked)}
                        title={allChecked ? 'Deselect all clients in stream' : 'Select all clients in stream'}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors"
                      >
                        {allChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-neutral-400" />
                        )}
                        <span>{allChecked ? 'Deselect All' : 'Select All'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenAddClient(stream.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Client</span>
                    </button>

                    {/* Rename Stream */}
                    <button
                      onClick={() => {
                        setEditingStream(stream);
                        setStreamNameInput(stream.name);
                        setStreamColorInput(stream.color || '#10b981');
                      }}
                      title="Rename stream"
                      aria-label={`Rename stream ${stream.name}`}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete Stream */}
                    <button
                      onClick={() => setDeletingStreamId(stream.id)}
                      title="Delete stream"
                      aria-label={`Delete stream ${stream.name}`}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Clients Table / List */}
                {streamClients.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
                    No clients under this stream yet.{' '}
                    <button
                      onClick={() => handleOpenAddClient(stream.id)}
                      className="text-emerald-600 dark:text-emerald-400 font-semibold underline hover:no-underline ml-1"
                    >
                      Add client now
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
                    {matchingClients.map((client) => (
                      <div
                        key={client.id}
                        className={`flex items-center justify-between p-3.5 sm:px-5 hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors ${
                          !client.isChecked ? 'opacity-60 bg-neutral-50/30 dark:bg-neutral-900/30' : ''
                        }`}
                      >
                        {/* Checkbox & Client Info */}
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={client.isChecked}
                              onChange={() => toggleIncomeEntry(client.id)}
                              aria-label={`Include ${client.clientName} in income calculation`}
                              className="w-4 h-4 sm:w-5 sm:h-5 rounded-md border-2 border-neutral-300 dark:border-neutral-600 text-emerald-600 accent-emerald-600 dark:accent-emerald-500 cursor-pointer transition-transform active:scale-95"
                            />
                          </label>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm font-semibold truncate ${
                                  client.isChecked
                                    ? 'text-neutral-900 dark:text-white'
                                    : 'text-neutral-500 dark:text-neutral-400 line-through'
                                }`}
                              >
                                {client.clientName}
                              </span>
                              {!client.isChecked && (
                                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                                  Excluded
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {client.date}
                              </span>
                              {client.notes && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[200px]">{client.notes}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Amount & Item Actions */}
                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          <div className="text-right">
                            <span
                              className={`text-sm font-bold font-mono ${
                                client.isChecked
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-neutral-400 dark:text-neutral-500'
                              }`}
                            >
                              {formatCurrency(client.amount, settings.currency)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditClient(client)}
                              title="Edit client entry"
                              aria-label={`Edit ${client.clientName}`}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingClientId(client.id)}
                              title="Delete client entry"
                              aria-label={`Delete ${client.clientName}`}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add or Edit Stream */}
      {(isAddStreamOpen || editingStream) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                {editingStream ? 'Rename Income Stream' : 'New Income Stream'}
              </h3>
              <button
                onClick={() => {
                  setIsAddStreamOpen(false);
                  setEditingStream(null);
                }}
                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStream} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Stream Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Freelance Consulting, Digital Products, Retainers"
                  value={streamNameInput}
                  onChange={(e) => setStreamNameInput(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Color Tag
                </label>
                <div className="flex items-center gap-2">
                  {['#10b981', '#059669', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#64748b'].map(
                    (c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setStreamColorInput(c)}
                        className={`w-7 h-7 rounded-full transition-transform ${
                          streamColorInput === c ? 'scale-115 ring-2 ring-offset-2 ring-emerald-500' : ''
                        }`}
                        style={{ backgroundColor: c }}
                        aria-label={`Select color ${c}`}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddStreamOpen(false);
                    setEditingStream(null);
                  }}
                  className="px-4 py-2 text-sm font-semibold rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  {editingStream ? 'Save Changes' : 'Create Stream'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add or Edit Client / Income Entry */}
      {isAddClientOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                {editingClient ? 'Edit Client Income Entry' : 'Add Client Income Entry'}
              </h3>
              <button
                onClick={() => {
                  setIsAddClientOpen(false);
                  setEditingClient(null);
                }}
                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Income Stream *
                </label>
                <select
                  required
                  value={clientFormStreamId}
                  onChange={(e) => setClientFormStreamId(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  {streams.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Client / Source Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp, Client X Retainer, Mobile App Sprint"
                  value={clientFormName}
                  onChange={(e) => setClientFormName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Amount ({settings.currency}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    placeholder="0.00"
                    value={clientFormAmount}
                    onChange={(e) => setClientFormAmount(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm font-mono rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={clientFormDate}
                    onChange={(e) => setClientFormDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Invoice #1042, Transferred via NEFT"
                  value={clientFormNotes}
                  onChange={(e) => setClientFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Checkbox inclusion toggle */}
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/80">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={clientFormChecked}
                    onChange={(e) => setClientFormChecked(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                      Include in active income calculation
                    </span>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Uncheck if this invoice is tentative or pending verification.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddClientOpen(false);
                    setEditingClient(null);
                  }}
                  className="px-4 py-2 text-sm font-semibold rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  {editingClient ? 'Save Client Entry' : 'Add Client Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Stream Confirmation */}
      {deletingStreamId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 shadow-xl">
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mb-3">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Delete Income Stream?
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              This will permanently delete this stream and all clients logged under it. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => setDeletingStreamId(null)}
                className="px-4 py-2 text-sm font-semibold rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteStream(deletingStreamId);
                  setDeletingStreamId(null);
                }}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                Delete Stream
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Client Confirmation */}
      {deletingClientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 shadow-xl">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Delete Client Entry?
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Are you sure you want to delete this client entry from the income records?
            </p>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => setDeletingClientId(null)}
                className="px-4 py-2 text-sm font-semibold rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteIncomeEntry(deletingClientId);
                  setDeletingClientId(null);
                }}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
