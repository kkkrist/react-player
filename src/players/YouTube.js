import React, { Component } from 'react'

import { callPlayer, getSDK, parseStartTime } from '../utils'
import createSinglePlayer from '../singlePlayer'

const SDK_URL = 'https://www.youtube.com/iframe_api'
const SDK_GLOBAL = 'YT'
const SDK_GLOBAL_READY = 'onYouTubeIframeAPIReady'
const MATCH_URL = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})/

export class YouTube extends Component {
  static displayName = 'YouTube'
  static canPlay = url => MATCH_URL.test(url)
  static loopOnEnded = true

  callPlayer = callPlayer
  load (url, isReady) {
    const { playsinline, controls, config, onError } = this.props
    const id = url && url.match(MATCH_URL)[1]
    if (isReady) {
      this.player.cueVideoById({
        videoId: id,
        startSeconds: parseStartTime(url)
      })
      return
    }
    getSDK(SDK_URL, SDK_GLOBAL, SDK_GLOBAL_READY, YT => YT.loaded).then(YT => {
      if (!this.container) return
      this.player = new YT.Player(this.container, {
        width: '100%',
        height: '100%',
        videoId: id,
        playerVars: {
          controls: controls ? 1 : 0,
          start: parseStartTime(url),
          origin: window.location.origin,
          playsinline: playsinline,
          ...config.youtube.playerVars
        },
        events: {
          onReady: this.props.onReady,
          onStateChange: this.onStateChange,
          onError: event => onError(event.data)
        }
      })
    }, onError)
  }
  onStateChange = ({ data }) => {
    const { onPlay, onPause, onBuffer, onEnded, onReady } = this.props
    const { PLAYING, PAUSED, BUFFERING, ENDED, CUED } = window[SDK_GLOBAL].PlayerState
    if (data === PLAYING) onPlay()
    if (data === PAUSED) onPause()
    if (data === BUFFERING) onBuffer()
    if (data === ENDED) onEnded()
    if (data === CUED) onReady()
  }
  play () {
    this.callPlayer('playVideo')
  }
  pause () {
    this.callPlayer('pauseVideo')
  }
  stop () {
    if (!document.body.contains(this.callPlayer('getIframe'))) return
    this.callPlayer('stopVideo')
  }
  seekTo (amount) {
    this.callPlayer('seekTo', amount)
  }
  setVolume (fraction) {
    this.callPlayer('setVolume', fraction * 100)
  }
  setPlaybackRate (rate) {
    this.callPlayer('setPlaybackRate', rate)
  }
  getDuration () {
    return this.callPlayer('getDuration')
  }
  getCurrentTime () {
    return this.callPlayer('getCurrentTime')
  }
  getSecondsLoaded () {
    return this.callPlayer('getVideoLoadedFraction') * this.getDuration()
  }
  ref = container => {
    this.container = container
  }
  render () {
    const style = {
      width: '100%',
      height: '100%',
      ...this.props.style
    }

    if (this.props.config.youtube.sandbox) {
      const {
        config: { youtube },
        controls,
        loop,
        height,
        url,
        width
      } = this.props
      const playerVars = {
        ...youtube.playerVars,
        controls: controls | 0,
        enablejsapi: 1,
        loop: loop | 0,
        origin: window.location.origin
      }
      const embedUrl = new URL('https://www.youtube.com/embed/' + url.match(MATCH_URL)[1])
      Object.keys(playerVars).forEach(key => {
        embedUrl.searchParams.set(key, playerVars[key])
      })

      return (
        <div style={style}>
          <iframe
            height={height ? (height.endsWith('px') ? height.slice(0, -2) : height) : '100%'}
            ref={this.ref}
            sandbox='allow-same-origin allow-scripts'
            src={embedUrl}
            style={this.props.style}
            width={width ? (width.endsWith('px') ? width.slice(0, -2) : width) : '100%'}
          />
        </div>
      )
    } else {
      return (
        <div style={style}>
          <div ref={this.ref} />
        </div>
      )
    }
  }
}

export default createSinglePlayer(YouTube)
