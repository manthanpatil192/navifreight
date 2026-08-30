import React, { useState } from 'react';
import { X, Database, Award, Layers, CheckCircle2, TrendingUp, Cpu, BookOpen, ExternalLink, ShieldCheck } from 'lucide-react';
import { ML_MODEL_METRICS } from '../data/mlModelStats';

export default function DatasetExplorerModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('datasets'); // 'datasets', 'ml_metrics', 'features', 'correlation'

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-elevated w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-maritime-900 flex items-center justify-center text-white">
              <Database className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Public Dataset Registry & ML Auditing Engine
              </h2>
              <p className="text-xs text-slate-500">
                100% Free Open Data Architecture • No Paid Bloomberg/Baltic Subscriptions Required
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-white text-xs font-semibold">
          <button
            onClick={() => setActiveTab('datasets')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'datasets'
                ? 'border-maritime-900 text-maritime-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Integrated Public Datasets (7)</span>
          </button>

          <button
            onClick={() => setActiveTab('ml_metrics')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'ml_metrics'
                ? 'border-maritime-900 text-maritime-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>ML Model Benchmarks & R²</span>
          </button>

          <button
            onClick={() => setActiveTab('features')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'features'
                ? 'border-maritime-900 text-maritime-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Feature Importance & Weights</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          
          {/* TAB 1: Public Datasets */}
          {activeTab === 'datasets' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 text-emerald-900 flex items-start space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Zero Data License Costs:</span> All 7 feeds used to train the freight forecast and vessel dispatch models are 100% open-source, government-published, or freely accessible via standard developer APIs.
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50 font-semibold text-slate-600 text-left">
                    <tr>
                      <th className="px-4 py-2.5">Data Source</th>
                      <th className="px-3 py-2.5">Dataset Ingested</th>
                      <th className="px-3 py-2.5">Frequency</th>
                      <th className="px-3 py-2.5">Role in Engine</th>
                      <th className="px-3 py-2.5 text-center">Cost & License</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {ML_MODEL_METRICS.publicDataSources.map((ds, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="px-4 py-2.5 font-bold text-slate-900">
                          {ds.name}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">
                          {ds.dataset}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 tabular-nums">
                          {ds.frequency}
                        </td>
                        <td className="px-3 py-2.5 text-maritime-800 font-medium">
                          {ds.correlationWithIndia}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                            {ds.cost}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: ML Model Benchmarks */}
          {activeTab === 'ml_metrics' && (
            <div className="space-y-4">
              
              {/* Top Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                  <div className="text-slate-500 text-[11px] font-semibold">Active R² Score</div>
                  <div className="text-xl font-bold text-maritime-900 tabular-nums">{ML_MODEL_METRICS.r2Score}</div>
                  <div className="text-[10px] text-emerald-600 font-medium">High variance fit</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                  <div className="text-slate-500 text-[11px] font-semibold">MAPE Error</div>
                  <div className="text-xl font-bold text-emerald-600 tabular-nums">{ML_MODEL_METRICS.mapePercent}%</div>
                  <div className="text-[10px] text-slate-500 font-medium">96.1% accuracy</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                  <div className="text-slate-500 text-[11px] font-semibold">RMSE ($/MT)</div>
                  <div className="text-xl font-bold text-slate-900 tabular-nums">${ML_MODEL_METRICS.rmseUSD}</div>
                  <div className="text-[10px] text-slate-500 font-medium">Per metric ton</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                  <div className="text-slate-500 text-[11px] font-semibold">Directional Accuracy</div>
                  <div className="text-xl font-bold text-maritime-900 tabular-nums">{ML_MODEL_METRICS.directionalAccuracyPercent}%</div>
                  <div className="text-[10px] text-emerald-600 font-medium">Trend prediction</div>
                </div>
              </div>

              {/* Model Comparison Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50 font-semibold text-slate-600 text-left">
                    <tr>
                      <th className="px-4 py-2.5">Model Architecture</th>
                      <th className="px-3 py-2.5 text-center">R² Score</th>
                      <th className="px-3 py-2.5 text-center">MAPE</th>
                      <th className="px-3 py-2.5 text-center">RMSE</th>
                      <th className="px-3 py-2.5 text-center">Directional Acc</th>
                      <th className="px-3 py-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {ML_MODEL_METRICS.modelComparison.map((m, idx) => (
                      <tr key={idx} className={m.status.includes('ACTIVE') ? 'bg-emerald-50/40 font-semibold' : ''}>
                        <td className="px-4 py-2.5 text-slate-900">
                          {m.modelName}
                        </td>
                        <td className="px-3 py-2.5 text-center tabular-nums">{m.r2}</td>
                        <td className="px-3 py-2.5 text-center tabular-nums">{m.mape}</td>
                        <td className="px-3 py-2.5 text-center tabular-nums">{m.rmse}</td>
                        <td className="px-3 py-2.5 text-center tabular-nums">{m.directionalAccuracy}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.status.includes('ACTIVE')
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-[11px] text-slate-500">
                Validated using <span className="font-semibold">{ML_MODEL_METRICS.validationMethod}</span> across {ML_MODEL_METRICS.totalTrainingSamples.toLocaleString()} data samples.
              </div>

            </div>
          )}

          {/* TAB 3: Feature Importance */}
          {activeTab === 'features' && (
            <div className="space-y-4">
              <p className="text-slate-600">
                Tree-based Gini impurity & SHAP (SHapley Additive exPlanations) attribution for freight rate prediction:
              </p>

              <div className="space-y-2.5">
                {ML_MODEL_METRICS.featureImportance.map((f, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1 font-semibold text-slate-800">
                      <span>{f.feature}</span>
                      <span className="text-maritime-900 tabular-nums">{f.importancePct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-maritime-800 h-full rounded-full"
                        style={{ width: `${f.importancePct * 2.8}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>Category: {f.category}</span>
                      <span>Rank #{idx + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Last retrained: August 2026 • Verified on Indian East Coast Corridors
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-md transition-colors"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
}
