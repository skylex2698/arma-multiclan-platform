import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Copy, Download } from 'lucide-react';
import { Card } from '../ui/Card';
import type { Event } from '../../types';
import { buildCommunicationChart } from '../../utils/communicationChart';

interface AutomaticCommunicationChartProps {
  event: Pick<Event, 'id' | 'name' | 'squads'>;
}

const getCurrentTheme = () =>
  document.documentElement.classList.contains('dark') ? 'dark' : 'light';

const downloadFile = (filename: string, content: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};

export function AutomaticCommunicationChart({
  event,
}: AutomaticCommunicationChartProps) {
  const renderId = useId().replace(/:/g, '');
  const chartRef = useRef<HTMLDivElement>(null);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => getCurrentTheme());
  const [svgMarkup, setSvgMarkup] = useState('');
  const [renderError, setRenderError] = useState('');
  const [copied, setCopied] = useState(false);
  const chart = useMemo(
    () => buildCommunicationChart(event, themeMode),
    [event, themeMode]
  );

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setThemeMode(getCurrentTheme());
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const renderChart = async () => {
      if (chart.orderedSquads.length === 0) {
        setSvgMarkup('');
        setRenderError('');
        return;
      }

      setRenderError('');

      try {
        const mermaid = (await import('mermaid')).default;

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: themeMode === 'dark' ? 'dark' : 'base',
          flowchart: {
            htmlLabels: true,
            curve: 'basis',
            nodeSpacing: 40,
            rankSpacing: 55,
            useMaxWidth: true,
          },
          themeVariables:
            themeMode === 'dark'
              ? {
                  background: '#0f172a',
                  primaryColor: '#111827',
                  primaryBorderColor: '#38bdf8',
                  primaryTextColor: '#e5eef7',
                  lineColor: '#94a3b8',
                  tertiaryColor: '#1f2937',
                  fontFamily: 'inherit',
                }
              : {
                  background: '#f8fafc',
                  primaryColor: '#ffffff',
                  primaryBorderColor: '#94a3b8',
                  primaryTextColor: '#0f172a',
                  lineColor: '#64748b',
                  tertiaryColor: '#f1f5f9',
                  fontFamily: 'inherit',
                },
        });

        const { svg } = await mermaid.render(
          `communication-chart-${renderId}`,
          chart.definition
        );

        if (cancelled) {
          return;
        }

        setSvgMarkup(svg);
      } catch (error) {
        if (!cancelled) {
          setRenderError('No se pudo renderizar el plan de comunicaciones.');
        }
      }
    };

    renderChart();

    return () => {
      cancelled = true;
    };
  }, [chart.definition, renderId, themeMode]);

  const handleCopySource = async () => {
    try {
      await navigator.clipboard.writeText(chart.definition);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt('Copia este Mermaid manualmente:', chart.definition);
    }
  };

  const handleDownloadSvg = () => {
    if (!svgMarkup) {
      return;
    }

    downloadFile(
      `communications-${event.id}.svg`,
      svgMarkup,
      'image/svg+xml;charset=utf-8'
    );
  };

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border border-military-200 bg-white/95 dark:border-gray-700 dark:bg-gray-900/95">
        <div className="flex flex-col gap-4 border-b border-military-200 px-5 py-4 dark:border-gray-700 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-military-900 dark:text-gray-100">
              Diagrama operativo
            </h3>
            <p className="text-sm text-military-500 dark:text-gray-400">
              Generado automáticamente desde la configuración de mando, frecuencias y enlaces.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopySource}
              className="btn btn-outline btn-sm"
            >
              <Copy className="h-4 w-4" />
              {copied ? 'Copiado' : 'Copiar Mermaid'}
            </button>
            <button
              type="button"
              onClick={handleDownloadSvg}
              disabled={!svgMarkup}
              className="btn btn-primary btn-sm"
            >
              <Download className="h-4 w-4" />
              Descargar SVG
            </button>
          </div>
        </div>

        <div className="grid gap-5 px-5 py-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="overflow-hidden rounded-2xl border border-military-200 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.12),_transparent_34%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(241,245,249,0.9))] p-4 dark:border-gray-700 dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_30%),linear-gradient(180deg,_rgba(15,23,42,0.98),_rgba(15,23,42,0.92))]">
            {chart.orderedSquads.length === 0 ? (
              <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-dashed border-military-300 px-6 text-center text-sm text-military-500 dark:border-gray-700 dark:text-gray-400">
                Este evento todavía no tiene escuadras. El plan aparecerá automáticamente
                cuando se definan.
              </div>
            ) : renderError ? (
              <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-red-200 bg-red-50 px-6 text-center text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                {renderError}
              </div>
            ) : (
              <div
                ref={chartRef}
                className="communication-mermaid flex min-h-[420px] items-center justify-center overflow-auto rounded-xl bg-white/80 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:bg-slate-950/40 [&>svg]:mx-auto [&>svg]:max-w-none"
                dangerouslySetInnerHTML={{ __html: svgMarkup }}
              />
            )}
          </div>

          <div className="space-y-4">
            <Card className="border border-military-200/80 bg-military-50/70 dark:border-gray-700 dark:bg-gray-900/40">
              <h4 className="text-sm font-semibold text-military-900 dark:text-gray-100">
                Escuadras sin enlace
              </h4>
              <div className="mt-3 flex flex-wrap gap-2">
                {chart.unlinkedSquads.length > 0 ? (
                  chart.unlinkedSquads.map((squad) => (
                    <span
                      key={squad.id}
                      className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/40 dark:text-cyan-300"
                    >
                      {squad.name}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-military-500 dark:text-gray-400">
                    Todas las escuadras tienen enlace configurado con mando.
                  </p>
                )}
              </div>
            </Card>

            <Card className="border border-military-200/80 bg-military-50/70 dark:border-gray-700 dark:bg-gray-900/40">
              <h4 className="text-sm font-semibold text-military-900 dark:text-gray-100">
                Internas pendientes
              </h4>
              <div className="mt-3 flex flex-wrap gap-2">
                {chart.squadsWithoutInternalFrequency.length > 0 ? (
                  chart.squadsWithoutInternalFrequency.map((squad) => (
                    <span
                      key={squad.id}
                      className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
                    >
                      {squad.name}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-military-500 dark:text-gray-400">
                    Todas las escuadras tienen frecuencia interna definida.
                  </p>
                )}
              </div>
            </Card>

            <details className="rounded-2xl border border-military-200 bg-white/80 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/60">
              <summary className="cursor-pointer text-sm font-semibold text-military-900 dark:text-gray-100">
                Ver fuente Mermaid
              </summary>
              <pre className="mt-3 overflow-x-auto rounded-xl bg-military-950 px-4 py-4 text-xs leading-6 text-green-200">
                {chart.definition}
              </pre>
            </details>
          </div>
        </div>
      </Card>
    </div>
  );
}
