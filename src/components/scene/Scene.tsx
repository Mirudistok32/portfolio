'use client';

import { useEffect, useRef } from 'react';

import { createScene, type SceneEngine } from './engine';

/**
 * Пиксельный пейзаж за контентом. Слои ночи и дня перетекают через opacity, параллакс — через transform.
 * data-depth — сдвиг за мышью и при смене страниц, data-lift — подъём при прокрутке страницы вниз.
 * Холсты farFx, midFx и fg перерисовываются каждый кадр: на них живут звери (fauna.ts).
 */
export function Scene({ page }: { page: number }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<SceneEngine | null>(null);

  useEffect(() => {
    const engine = createScene(rootRef.current!);
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setPage(page);
  }, [page]);

  return (
    <div className="scene" ref={rootRef} aria-hidden="true">
      <div className="layer" data-depth="0.08" data-lift="0.3">
        <div className="layer-in" data-l="sky">
          <canvas className="sky-c s0" />
          <canvas className="sky-c s1" />
          <canvas className="sky-c s2" />
          <div className="aurora">
            <canvas data-c="aur0" />
            <canvas data-c="aur1" />
          </div>
          <canvas className="cosmos" data-c="cosmos" />
          <div className="sun">
            <canvas data-c="sun" width={22} height={22} />
          </div>
          <canvas className="clouds" data-c="clouds" />
        </div>
      </div>
      <div className="layer" data-depth="0.25" data-lift="0.62">
        <div className="layer-in" data-l="far">
          <canvas className="land" data-c="farN" />
          <canvas className="land day-c" data-c="farD" />
          <i className="arcane" />
          <canvas className="land" data-c="farFx" />
        </div>
      </div>
      <div className="layer" data-depth="0.5" data-lift="0.74">
        <div className="layer-in" data-l="mid">
          <canvas className="land" data-c="midN" />
          <canvas className="land day-c" data-c="midD" />
          <canvas className="land" data-c="midFx" />
        </div>
      </div>
      <div className="layer" data-depth="0.85" data-lift="0.86">
        <div className="layer-in" data-l="fore">
          <canvas className="land" data-c="foreN" />
          <canvas className="land day-c" data-c="foreD" />
          <canvas className="land" data-c="fg" />
          <canvas className="land mist" data-c="mist" />
        </div>
      </div>
      <div className="layer" data-depth="1" data-lift="1">
        <div className="layer-in">
          <canvas className="ground" data-c="groundN" />
          <canvas className="ground day-c" data-c="groundD" />
        </div>
      </div>
      <canvas className="haze" data-c="haze" />
      <canvas className="fx" data-c="fx" />
      <div className="vignette" />
    </div>
  );
}
