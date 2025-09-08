import React, { useEffect, useRef, useState } from "react"
import BlackHoleEngine from "../../components/util/SpaceLib/BlackHoleEngine.tsx"

const BlackHole = () => {
    const containerRef = useRef<HTMLDivElement>(null)
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                })
            }
        }

        updateDimensions()

        const resizeObserver = new ResizeObserver(updateDimensions)
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current)
        }

        return () => resizeObserver.disconnect()
    }, [])

    return (
        <div ref={containerRef} className="w-full h-full bg-black">
            {dimensions.width > 0 && dimensions.height > 0 ?
                <BlackHoleEngine
                    width={dimensions.width} 
                    height={dimensions.height}
                />
            :
            <></>
            }
        </div>
    )
}

export {BlackHole}