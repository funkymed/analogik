import React, { useState } from 'react'
import { getTracks, getAuthors, getYears } from './tracks'
import PlayerControl from './Components/PlayerControl'
import TracksList from './Components/TrackList'
import AuthorList from './Components/AuthorList'
import YearList from './Components/YearList'
import RenderCanvas from './Components/RenderCanvas.tsx'
import 'rsuite/dist/rsuite.min.css'

import { Drawer, IconButton, CustomProvider, Loader, Radio, RadioGroup } from 'rsuite'
import PlayIcon from '@rsuite/icons/legacy/Play'
import './App.css'
const ChiptuneJsPlayer = window['ChiptuneJsPlayer']
const ChiptuneJsConfig = window['ChiptuneJsConfig']

const Audio = new AudioContext()

const config = new ChiptuneJsConfig({
    repeatCount: -1,
    volume: 90,
    context: Audio,
})

const player = new ChiptuneJsPlayer(config)
player.pause()

function App() {
    const [currentTrack, setCurrentTrack] = useState(0)
    const [year, setYear] = useState(0)
    const [author, setAuthor] = useState(0)
    const years = getYears()
    const [authors, setAuthors] = useState(getAuthors())
    const [isPlay, setIsPlay] = useState(0)
    const [size, setSize] = useState(0)
    const [meta, setMeta] = useState(0)
    // const [duration, setDuration] = useState(0);
    const [isLoading, setIsLoading] = useState(0)
    const [analyser, setAnalyser] = useState(0)
    const [open, setOpen] = useState(false)
    const [volume, setVolume] = useState(90)
    const [selection, setSelection] = useState('all')
    const [mods, setMods] = useState(getTracks(year, author, selection))

    function filterYear(year) {
        setYear(year)
        setAuthors(getAuthors(year))
        setMods(getTracks(year, author, selection))
    }

    function filterAuthor(author) {
        setAuthor(author)
        setMods(getTracks(year, author, selection))
    }

    const filterSelection = (value) => {
        setSelection(value)
        setMods(getTracks(year, author, value))
    }

    const loadTrack = (track) => {
        setIsLoading(true)
        setOpen(false)
        player
            .load(`./mods/${track.url}`)
            .then((buffer) => {
                setIsLoading(false)

                player.pause()
                player.play(buffer)
                player.seek(0)

                setIsPlay(true)

                setCurrentTrack(track)
                setSize(buffer.byteLength)
                setMeta(player.metadata())

                const _analyser = context.createAnalyser()

                _analyser.fftSize = 2048
                _analyser.maxDecibels = -10
                _analyser.minDecibels = -90
                _analyser.smoothingTimeConstant = 0.05

                // const audio = document.createElement('audio')
                // const source = context.createMediaElementSource(audio)
                // source.connect(analyser)
                _analyser.connect(Audio.destination)

                setAnalyser(_analyser)

                setDuration(player.duration())
            })
            .catch(() => {
                setIsLoading(false)
                setIsPlay(false)
            })
    }
    const setPlayerVolume = (value) => {
        setVolume(value)
        player.setVolume(value)
    }

    const togglePlay = () => {
        setIsPlay(!isPlay)
        player.togglePause()
    }

    return (
        <CustomProvider theme="dark">
            <Drawer size="sm" placement="right" open={open} onClose={() => setOpen(false)}>
                <Drawer.Header>
                    <Drawer.Title>Tracks</Drawer.Title>
                </Drawer.Header>
                <Drawer.Body>
                    <h3>Selection</h3>
                    <RadioGroup
                        inline
                        appearance="picker"
                        defaultValue="all"
                        value={selection}
                        onChange={filterSelection}
                    >
                        <Radio value="all">All</Radio>
                        <Radio value="selecta">Selecta</Radio>
                        <Radio value="bleep">Bleep</Radio>
                    </RadioGroup>
                    <br />
                    <br />
                    <YearList year={year} years={years} filterYear={filterYear} />
                    <br />
                    <AuthorList author={author} authors={authors} filterAuthor={filterAuthor} />
                    <br />
                    <TracksList mods={mods} currentTrack={currentTrack} load={loadTrack} />
                    <br />
                </Drawer.Body>
            </Drawer>

            {currentTrack && !isLoading ? (
                <PlayerControl
                    player={player}
                    currentTrack={currentTrack}
                    meta={meta}
                    togglePlay={togglePlay}
                    isPlay={isPlay}
                    setIsPlay={setIsPlay}
                    size={size}
                    setVolume={setPlayerVolume}
                    volume={volume}
                />
            ) : (
                <Loader backdrop content="loading..." vertical />
            )}
            <IconButton
                appearance="primary"
                icon={<PlayIcon />}
                style={{ position: 'absolute', bottom: 15, right: 15 }}
                onClick={() => setOpen(true)}
                circle
                size="lg"
            ></IconButton>
            <RenderCanvas
                player={player}
                audioContext={Audio}
                isPlay={isPlay}
                currentTrack={currentTrack}
                isLoading={isLoading}
                analyser={analyser}
            />
        </CustomProvider>
    )
}

export default App
