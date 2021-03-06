/*
 * @Author: Caven
 * @Date: 2020-01-31 15:51:32
 * @Last Modified by: Caven
 * @Last Modified time: 2020-05-12 14:28:29
 */

import DrawPoint from './draw/DrawPoint'
import DrawPolyline from './draw/DrawPolyline'
import DrawPolygon from './draw/DrawPolygon'
import DrawCircle from './draw/DrawCircle'
import DrawRect from './draw/DrawRect'
import EditPoint from './edit/EditPoint'
import EditPolyline from './edit/EditPolyline'

const { OverlayType, Util } = DC

const { Cesium } = DC.Namespace

class Plot {
  constructor(viewer) {
    if (!Util.checkViewer(viewer)) {
      throw new Error('Plot: the viewer invalid')
    }
    this._viewer = viewer
    this._plotEvent = new Cesium.Event()
    this._callback = undefined
    this._drawWorker = undefined
    this._editWorker = undefined
    this._drawLayer = new Cesium.CustomDataSource('plot-draw-layer')
    this._viewer.delegate.dataSources.add(this._drawLayer)
    this._markerLayer = new DC.VectorLayer('plot-marker-layer')
    this._viewer.addLayer(this._markerLayer)
    this._state = undefined
  }

  _completeCallback(e) {
    this._drawWorker = undefined
    this._editWorker = undefined
    this._viewer.tooltip.enable = false
    this._state === 'draw' && this._drawLayer.entities.removeAll()
    this._state === 'edit' && this._markerLayer.clear()
    if (this._callback) {
      this._callback.call(this, e)
    }
  }

  _bindEvent(callback) {
    this._plotEvent.removeEventListener(this._completeCallback, this)
    this._callback = callback
    this._plotEvent.addEventListener(this._completeCallback, this)
  }

  _createDrawWorker(type, style) {
    let info = {
      viewer: this._viewer,
      plotEvent: this._plotEvent,
      layer: this._drawLayer,
    }
    switch (type) {
      case OverlayType.POINT:
        this._drawWorker = new DrawPoint(info, style)
        break
      case OverlayType.POLYLINE:
        this._drawWorker = new DrawPolyline(info, style)
        break
      case OverlayType.POLYGON:
        this._drawWorker = new DrawPolygon(info, style)
        break
      case OverlayType.CIRCLE:
        this._drawWorker = new DrawCircle(info, style)
        break
      case OverlayType.RECT:
        this._drawWorker = new DrawRect(info, style)
        break
      default:
        break
    }
  }

  _createEditWorker(overlay) {
    let info = {
      viewer: this._viewer,
      plotEvent: this._plotEvent,
      layer: this._markerLayer,
      overlay: overlay,
    }
    switch (overlay.type) {
      case OverlayType.POINT:
        this._editWorker = new EditPoint(info)
        break
      case OverlayType.POLYLINE:
        this._editWorker = new EditPolyline(info)
        break
      case OverlayType.POLYGON:
        this._drawWorker = new DrawPolygon(info)
        break
      case OverlayType.CIRCLE:
        this._drawWorker = new DrawCircle(info)
        break
      case OverlayType.RECT:
        this._drawWorker = new DrawRect(info)
        break
      default:
        break
    }
  }

  draw(type, callback, style) {
    this._state = 'draw'
    this._viewer.tooltip.enable = true
    this._bindEvent(callback)
    this._createDrawWorker(type, style)
    this._drawWorker && this._drawWorker.start()
  }

  edit(overlay, callback) {
    this._state = 'edit'
    this._viewer.tooltip.enable = true
    this._bindEvent(callback)
    this._createEditWorker(overlay)
    this._editWorker && this._editWorker.start()
  }
}

export default Plot
