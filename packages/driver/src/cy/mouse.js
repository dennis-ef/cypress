const $dom = require('../dom')
const $elements = require('../dom/elements')
const $ = require('jquery')
const _ = require('lodash')
const $Keyboard = require('./keyboard')

const create = (state, getActiveModifiers) => {

  const _setMouseState = () => {

  }
  
  return {
    onBeforeTestRun () {
      this._reset()
    },

    _reset () {
      this.mouseState = {
        x: 0,
        y: 0,
      }
      this.lastHoveredEl = null
    },

    mouseState: {
      x: 0,
      y: 0,
    },

    lastHoveredEl: null,

    _setMouseState: (x, y) => {
      this.mouseState = { x, y }
    },

    _moveMouse (el, { x, y }) {
      this.mouseState = { x, y }
      this._moveMouseEvents(el, { x, y })
    },

    moveMouseToCoords ({ x, y }) {
      const el = state('document').elementFromPoint(x, y)

      this._moveMouse(el, { x, y })
    },

    _moveMouseEvents (el, { x, y }) {

      const win = $dom.getWindowByElement(el)

      const _activeModifiers = getActiveModifiers()
      const defaultMouseOptions = $Keyboard.mixinModifiers({
        clientX: x,
        clientY: y,
        screenX: x,
        screenY: y,
        x,
        y,
        button: 0,
        which: 0,
        buttons: 0,
        composed: true,
        view: win,
      }, _activeModifiers)

      const defaultPointerOptions = $Keyboard.mixinModifiers({
        clientX: x,
        clientY: y,
        screenX: x,
        screenY: y,
        x,
        y,
        button: -1,
        which: 0,
        buttons: 0,
        composed: true,
        view: win,
        pointerId: 1,
        pointerType: 'mouse',
        isPrimary: true,
      }, _activeModifiers)

      let pointerout = null
      let pointerleave = null
      let pointerover = null
      let pointerenter = null
      let mouseout = null
      let mouseleave = null
      let mouseover = null
      let mouseenter = null
      let pointermove = null
      let mousemove = null

      const lastHoveredElAttached = this.lastHoveredEl && $elements.isAttached($(el))

      if (!lastHoveredElAttached) {
        this.lastHoveredEl = null
      }

      const hoveredElChanged = el !== this.lastHoveredEl
      let commonAncestor = null

      if (hoveredElChanged && this.lastHoveredEl) {
        commonAncestor = $elements.getFirstCommonAncestor(el, this.lastHoveredEl)
        pointerout = () => {
          sendPointerout(this.lastHoveredEl, _.extend({}, defaultPointerOptions, { relatedTarget: el }))
        }
        mouseout = () => {
          sendMouseout(this.lastHoveredEl, _.extend({}, defaultMouseOptions, { relatedTarget: el }))
        }

        let curParent = this.lastHoveredEl

        const elsToSendMouseleave = []

        while (curParent && curParent !== commonAncestor) {
          elsToSendMouseleave.push(curParent)
          curParent = curParent.parentNode
        }

        pointerleave = () => {
          elsToSendMouseleave.forEach((elToSend) => {
            sendPointerleave(elToSend, _.extend({}, defaultPointerOptions, { relatedTarget: el }))
          })
        }
        mouseleave = () => {
          elsToSendMouseleave.forEach((elToSend) => {
            sendMouseleave(elToSend, _.extend({}, defaultMouseOptions, { relatedTarget: el }))
          })
        }

      }

      if (hoveredElChanged) {
        if (el && $elements.isAttached($(el))) {

          mouseover = () => {
            sendMouseover(el, _.extend({}, defaultMouseOptions, { relatedTarget: this.lastHoveredEl }))
          }
          pointerover = () => {
            sendPointerover(el, _.extend({}, defaultPointerOptions, { relatedTarget: this.lastHoveredEl }))
          }

          let curParent = el
          const elsToSendMouseenter = []

          while (curParent && curParent.ownerDocument && curParent !== commonAncestor) {
            elsToSendMouseenter.push(curParent)
            curParent = curParent.parentNode
          }

          elsToSendMouseenter.reverse()

          pointerenter = () => {
            return elsToSendMouseenter.forEach((elToSend) => {
              sendPointerenter(elToSend, _.extend({}, defaultPointerOptions, { relatedTarget: this.lastHoveredEl }))
            })
          }
          mouseenter = () => {
            return elsToSendMouseenter.forEach((elToSend) => {
              sendMouseenter(elToSend, _.extend({}, defaultMouseOptions, { relatedTarget: this.lastHoveredEl }))
            })
          }
        }

      }

      // if (!Cypress.config('mousemoveBeforeMouseover') && el) {
      pointermove = () => {
        sendPointermove(el, defaultPointerOptions)
      }
      mousemove = () => {
        sendMousemove(el, defaultMouseOptions)
      }
      pointerout && pointerout()
      pointerleave && pointerleave()
      pointerover && pointerover()
      pointerenter && pointerenter()
      mouseout && mouseout()
      mouseleave && mouseleave()
      mouseover && mouseover()
      mouseenter && mouseenter()
      this.lastHoveredEl = $elements.isAttached($(el)) ? el : null
      pointermove && pointermove()
      mousemove && mousemove()
    // }

    },

    mouseDown ($elToClick, fromViewport) {
      const el = $elToClick.get(0)
      const _activeModifiers = $Keyboard.activeModifiers()
      const modifiers = _activeModifiers.length ? _activeModifiers.join(', ') : null

      const win = $dom.getWindowByElement(el)

      const { x, y } = fromViewport

      // these are the coords from the document, ignoring scroll position
      const fromDocCoords = _getFromDocCoords(x, y, win)
      const defaultOptions = $Keyboard.mixinModifiers({
        clientX: x,
        clientY: y,
        pageX: fromDocCoords.x,
        pageY: fromDocCoords.y,
        layerX: fromDocCoords.x,
        layerY: fromDocCoords.y,
        screenX: fromDocCoords.x,
        screenY: fromDocCoords.y,
        x,
        y,
        button: 0,
        which: 1,
        // allow propagation out of root of shadow-dom
        // https://developer.mozilla.org/en-US/docs/Web/API/Event/composed
        composed: true,
        buttons: 1,
        // number of clicks in succession
        detail: 1,
        // only for events involving moving cursor
        relatedTarget: null,
        currentTarget: el,
        view: win,
      }, _activeModifiers)

      this._moveMouse(el, { x, y })

      // TODO: pointer events should have fractional coordinates, not rounded
      const pointerdownProps = sendPointerdown(
        el,
        _.extend({}, defaultOptions, {
          pressure: 0.5,
          pointerType: 'mouse',
          pointerId: 1,
          isPrimary: true,
          detail: 0,
        })
      )

      if (pointerdownProps.preventedDefault) {
        return {
          pointerdownProps,
          modifiers,
        }
      }

      const mousedownProps = sendMousedown(el, defaultOptions)

      return {
        pointerdownProps,
        mousedownProps,
        modifiers,
      }

    },

    mouseUp ($elToClick, fromViewport, { pointerdownProps }) {
      const el = $elToClick.get(0)
      const win = $dom.getWindowByElement(el)

      const _activeModifiers = $Keyboard.activeModifiers()
      const modifiers = _activeModifiers.length ? _activeModifiers.join(', ') : null

      const defaultOptions = $Keyboard.mixinModifiers({
        view: win,
        clientX: fromViewport.x,
        clientY: fromViewport.y,
        buttons: 0,
        detail: 1,
      }, _activeModifiers)

      const pointerupProps = sendPointerup(el, defaultOptions)

      if (pointerdownProps.preventedDefault) {
        return {
          pointerupProps,
          modifiers,
        }
      }

      const mouseupProps = sendMouseup(el, defaultOptions)

      return {
        pointerupProps,
        mouseupProps,
        modifiers,
      }
    },

    click ($elToClick, fromViewport) {
      const el = $elToClick.get(0)

      const win = $dom.getWindowByElement(el)
      const _activeModifiers = getActiveModifiers()
      const clickEvtProps = $Keyboard.mixinModifiers({
        bubbles: true,
        cancelable: true,
        view: win,
        clientX: fromViewport.x,
        clientY: fromViewport.y,
        buttons: 0,
        detail: 1,
      }, _activeModifiers)

      const clickEvt = new MouseEvent('click', clickEvtProps)

      //# ensure this property exists on older chromium versions
      if (clickEvt.buttons == null) {
        clickEvt.buttons = 0
      }

      clickEvt.stopPropagation = function (...args) {
        this._hasStoppedPropagation = true

        return stopPropagation.apply(this, args)
      }

      const cancelled = !el.dispatchEvent(clickEvt)

      const props = {
        preventedDefault: cancelled,
        stoppedPropagation: !!clickEvt._hasStoppedPropagation,
      }

      const modifiers = $Keyboard.activeModifiers()

      if (modifiers.length) {
        props.modifiers = modifiers.join(', ')
      }

      return props
    },
  }
}

const { stopPropagation } = window.MouseEvent.prototype

const sendEvent = (evtName, el, evtOptions, bubbles = false, cancelable = false, constructor) => {
  evtOptions = _.extend({}, evtOptions, { bubbles, cancelable })
  const evt = new constructor(evtName, _.extend({}, evtOptions, { bubbles, cancelable }))

  if (bubbles) {
    evt.stopPropagation = function (...args) {
      this._hasStoppedPropagation = true

      return stopPropagation.apply(this, ...args)
    }
  }

  const preventedDefault = !el.dispatchEvent(evt)

  return {
    stoppedPropagation: !!evt._hasStoppedPropagation,
    preventedDefault,
  }

}

const sendPointerEvent = (el, evtOptions, evtName, bubbles = false, cancelable = false) => {
  const constructor = el.ownerDocument.defaultView.PointerEvent

  return sendEvent(evtName, el, evtOptions, bubbles, cancelable, constructor)
}
const sendMouseEvent = (el, evtOptions, evtName, bubbles = false, cancelable = false) => {
  const constructor = el.ownerDocument.defaultView.MouseEvent

  return sendEvent(evtName, el, evtOptions, bubbles, cancelable, constructor)
}

const sendPointerup = (el, evtOptions) => {
  return sendPointerEvent(el, evtOptions, 'pointerup', true, true)
}
const sendPointerdown = (el, evtOptions) => {
  return sendPointerEvent(el, evtOptions, 'pointerdown', true, true)
}
const sendPointermove = (el, evtOptions) => {
  return sendPointerEvent(el, evtOptions, 'pointermove', true, true)
}
const sendPointerover = (el, evtOptions) => {
  return sendPointerEvent(el, evtOptions, 'pointerover', true, true)
}
const sendPointerenter = (el, evtOptions) => {
  return sendPointerEvent(el, evtOptions, 'pointerenter', false, false)
}
const sendPointerleave = (el, evtOptions) => {
  return sendPointerEvent(el, evtOptions, 'pointerleave', false, false)
}
const sendPointerout = (el, evtOptions) => {
  return sendPointerEvent(el, evtOptions, 'pointerout', true, true)
}

const sendMouseup = (el, evtOptions) => {
  return sendMouseEvent(el, evtOptions, 'mouseup', true, true)
}
const sendMousedown = (el, evtOptions) => {
  return sendMouseEvent(el, evtOptions, 'mousedown', true, true)
}
const sendMousemove = (el, evtOptions) => {
  return sendMouseEvent(el, evtOptions, 'mousemove', true, true)
}
const sendMouseover = (el, evtOptions) => {
  return sendMouseEvent(el, evtOptions, 'mouseover', true, true)
}
const sendMouseenter = (el, evtOptions) => {
  return sendMouseEvent(el, evtOptions, 'mouseenter', false, false)
}
const sendMouseleave = (el, evtOptions) => {
  return sendMouseEvent(el, evtOptions, 'mouseleave', false, false)
}
const sendMouseout = (el, evtOptions) => {
  return sendMouseEvent(el, evtOptions, 'mouseout', true, true)
}

const _getFromDocCoords = (x, y, win) => {
  return {
    x: win.scrollX + x,
    y: win.scrollY + y,
  }
}

module.exports = {
  create,
}
