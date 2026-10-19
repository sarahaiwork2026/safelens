import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { GeoJSONSource, Map as MapInstance, Marker } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { IncidentSummary } from 'core';
import { circlePolygon } from 'core';
import { copy } from '../../copy';
import { severityClass } from '../../components/severity';
import { ActionLink, EmptyState } from '../../components/ui';
import { useMedia } from '../../lib/useMedia';
import { useTheme } from '../../lib/theme';
maplibregl.setWorkerUrl(workerUrl);
interface Props {
  incidents: IncidentSummary[];
  selected: number | null;
  onSelect?: ((ref: number) => void) | undefined;
  onInView?: ((refs: number[]) => void) | undefined;
  interactive?: boolean;
  fallbackTo?: string;
  fallbackLabel?: string;
}
export default function MapCanvas({
  incidents,
  selected,
  onSelect,
  onInView,
  interactive = true,
  fallbackTo = '/incidents',
  fallbackLabel = copy.map.list,
}: Props) {
  const container = useRef<HTMLDivElement>(null),
    map = useRef<MapInstance | null>(null),
    markers = useRef(new Map<number, Marker>()),
    firstSelection = useRef(true);
  const dark = useTheme() === 'dark',
    reduced = useMedia('(prefers-reduced-motion: reduce)');
  const [loadedTheme, setLoadedTheme] = useState<boolean | null>(null),
    [failedTheme, setFailedTheme] = useState<boolean | null>(null);
  const ready = loadedTheme === dark,
    failed = failedTheme === dark;
  useEffect(() => {
    if (!container.current) return;
    const markerCollection = markers.current;
    let instance: MapInstance;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      instance = new maplibregl.Map({
        container: container.current,
        style: dark
          ? 'https://tiles.openfreemap.org/styles/dark'
          : 'https://tiles.openfreemap.org/styles/positron',
        center: [67.06, 24.88],
        zoom: interactive ? 10.6 : 12,
        minZoom: 9.5,
        maxZoom: 16,
        maxBounds: [
          [66.6, 24.65],
          [67.6, 25.25],
        ],
        interactive,
        attributionControl: false,
      });
      map.current = instance;
      instance.addControl(
        new maplibregl.AttributionControl({
          compact: false,
          customAttribution: copy.map.attribution,
        }),
      );
      if (interactive)
        instance.addControl(
          new maplibregl.NavigationControl({ showCompass: false }),
          'bottom-right',
        );
      instance.on('load', () => {
        if (timer) clearTimeout(timer);
        for (const layer of instance.getStyle().layers ?? [])
          if (layer.type === 'symbol' && /poi|transit/i.test(layer.id))
            instance.setLayoutProperty(layer.id, 'visibility', 'none');
        setLoadedTheme(dark);
      });
      instance.on('error', () => {
        setFailedTheme(dark);
      });
      timer = setTimeout(() => {
        if (!instance.loaded()) setFailedTheme(dark);
      }, 8000);
    } catch {
      queueMicrotask(() => setFailedTheme(dark));
    }
    return () => {
      if (timer) clearTimeout(timer);
      for (const marker of markerCollection.values()) marker.remove();
      markerCollection.clear();
      map.current?.remove();
      map.current = null;
    };
  }, [dark, interactive]);
  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready || failed) return;
    const refs = new Set(incidents.map((i) => i.ref));
    for (const [ref, marker] of markers.current)
      if (!refs.has(ref)) {
        marker.remove();
        markers.current.delete(ref);
      }
    for (const incident of incidents) {
      let marker = markers.current.get(incident.ref);
      if (!marker) {
        const button = document.createElement('button');
        button.type = 'button';
        marker = new maplibregl.Marker({ element: button })
          .setLngLat([incident.lng, incident.lat])
          .addTo(instance);
        markers.current.set(incident.ref, marker);
      }
      const button = marker.getElement();
      button.className = `map-marker ${severityClass[incident.severity]} ${incident.severity === 3 ? 'pulse-high' : incident.severity === 2 ? 'pulse-mod' : ''} ${selected === incident.ref ? 'is-selected' : ''}`;
      button.style.width =
        button.style.height = `${incident.reportCount >= 6 ? 22 : incident.reportCount >= 3 ? 18 : 14}px`;
      button.textContent =
        incident.reportCount >= 6 ? String(incident.reportCount) : '';
      button.setAttribute(
        'aria-label',
        `${incident.simulated ? `${copy.demo.badge} · ` : ''}${copy.severity[incident.severity]} · ${copy.incident.title(copy.type[incident.type], incident.areaName)} · ${copy.incident.reports(incident.reportCount)}`,
      );
      button.setAttribute('aria-pressed', String(selected === incident.ref));
      button.title = `${copy.incident.title(copy.type[incident.type], incident.areaName)} · ${copy.incident.reports(incident.reportCount)}`;
      button.onclick = () => onSelect?.(incident.ref);
    }
    const visible = () => {
      const bounds = instance.getBounds();
      for (const incident of incidents) {
        const button = markers.current.get(incident.ref)?.getElement();
        if (button)
          button.hidden = !bounds.contains([incident.lng, incident.lat]);
      }
      onInView?.(
        incidents
          .filter((i) => bounds.contains([i.lng, i.lat]))
          .map((i) => i.ref),
      );
    };
    visible();
    instance.on('moveend', visible);
    return () => {
      instance.off('moveend', visible);
    };
  }, [incidents, selected, onSelect, onInView, ready, failed]);
  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready || failed) return;
    const incident = incidents.find((i) => i.ref === selected);
    const polygon = incident
      ? circlePolygon(incident)
      : { type: 'FeatureCollection' as const, features: [] };
    const source = instance.getSource('group-radius') as
      GeoJSONSource | undefined;
    if (source) source.setData(polygon);
    else {
      instance.addSource('group-radius', { type: 'geojson', data: polygon });
      instance.addLayer({
        id: 'group-radius-fill',
        type: 'fill',
        source: 'group-radius',
        paint: {
          'fill-color': dark ? '#7B9BFF' : '#2F5BDA',
          'fill-opacity': 0.08,
        },
      });
      instance.addLayer({
        id: 'group-radius-line',
        type: 'line',
        source: 'group-radius',
        paint: {
          'line-color': dark ? '#7B9BFF' : '#2F5BDA',
          'line-opacity': 0.6,
          'line-width': 1.5,
          'line-dasharray': [3, 3],
        },
      });
    }
    if (incident) {
      const camera = {
        center: [incident.lng, incident.lat] as [number, number],
        zoom: 12,
      };
      if (firstSelection.current || reduced) instance.jumpTo(camera);
      else instance.easeTo({ ...camera, duration: 600 });
      firstSelection.current = false;
    }
  }, [selected, incidents, ready, failed, dark, reduced]);
  return (
    <div className={`map-canvas ${failed ? 'map-failed' : ''}`}>
      <div ref={container} className="map-container" hidden={failed} />
      {failed && (
        <EmptyState title={copy.map.failure}>
          <ActionLink to={fallbackTo} variant="secondary">
            {fallbackLabel}
          </ActionLink>
        </EmptyState>
      )}
    </div>
  );
}
