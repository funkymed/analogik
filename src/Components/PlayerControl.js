import { useEffect, useState } from 'react'
import { IconButton, Progress, ButtonGroup, Panel, Slider, FlexboxGrid, Divider } from 'rsuite'
import PauseIcon from '@rsuite/icons/legacy/Pause'
import PlayIcon from '@rsuite/icons/legacy/Play'
import StopIcon from '@rsuite/icons/legacy/Stop'
import { Capitalize } from '../utils'

function PlayerControl({
    player,
    isPlay,
    setIsPlay,
    volume,
    setVolume,
    togglePlay,
    currentTrack,
    meta,
    size,
}) {
    const [playing, setPlaying] = useState(false)

    useEffect(() => {
        setPlaying(isPlay)
    }, [isPlay, setIsPlay])

    return (
        <>
            <div style={{ width: 250, position: 'absolute', bottom: 15, left: 15 }}>
                <label>Volume </label>
                <Slider
                    progress={true}
                    defaultValue={volume}
                    value={volume}
                    onChange={(value) => {
                        setVolume(value)
                    }}
                />
            </div>

            <div style={{ position: 'absolute', top: 15, left: 15 }}>
                <ButtonGroup size="sm">
                    {isPlay ? (
                        <IconButton
                            icon={<PlayIcon />}
                            placement="left"
                            onClick={() => togglePlay()}
                        />
                    ) : (
                        <IconButton
                            icon={<PauseIcon />}
                            placement="left"
                            onClick={() => togglePlay()}
                        />
                    )}

                    <IconButton
                        icon={<StopIcon />}
                        placement="left"
                        onClick={() => {
                            player.seek(0)
                            player.pause()
                            setIsPlay(false)
                        }}
                    />
                </ButtonGroup>
            </div>

            <FlexboxGrid
                justify="space-around"
                align="middle"
                style={{
                    display: 'flex',
                    height: window.innerHeight,
                    opacity: 0.5,
                }}
            >
                <FlexboxGrid.Item colspan={12}>
                    <Panel
                        shaded
                        bordered
                        style={{
                            textAlign: 'center',
                        }}
                    >
                        <h4 style={{ color: 'red' }}>
                            {meta.title ? meta.title : currentTrack.filename}
                        </h4>
                        <b>
                            by{' '}
                            {currentTrack.author.map(function (a, i, row) {
                                let t = Capitalize(a)
                                if (i + 1 !== row.length) {
                                    t += ' & '
                                }
                                return t
                            })}{' '}
                            in {currentTrack.year}
                        </b>
                        <br />
                        <p>{size.toLocaleString()} octets</p>
                        <br />
                        <Divider>Message</Divider>
                        <Panel
                            style={{
                                whiteSpace: 'pre-wrap',
                                maxHeight: 110,
                                overflowY: 'overlay',
                                scrollbarColor: 'red',
                            }}
                        >
                            {meta.message}
                        </Panel>
                    </Panel>
                </FlexboxGrid.Item>
            </FlexboxGrid>
        </>
    )
}

export default PlayerControl
