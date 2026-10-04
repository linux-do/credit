"use client"

import { useState } from "react"
import Image from "next/image"
import { motion, useReducedMotion } from "motion/react"
import { QRCodeSVG } from "qrcode.react"

export function RedEnvelopeShare({ link }: { link: string }) {
  const [playing, setPlaying] = useState(false)
  const [replay, setReplay] = useState(0)
  const reduceMotion = useReducedMotion()

  return (
    <>
      <div className="-mt-2 flex justify-center py-1 md:hidden">
        <div className="w-1/2 rounded-xl bg-white p-1 shadow-sm ring-1 ring-black/5 sm:p-2">
          <QRCodeSVG value={link} size={224} marginSize={4} level="M" title="红包领取二维码" className="h-auto w-full" />
        </div>
      </div>
      <div
        className="relative mx-auto -mt-2 hidden w-fit grid-cols-[176px_90px] items-center gap-3 py-1 md:grid"
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") setPlaying(true)
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") setPlaying(false)
        }}
        onFocus={() => setPlaying(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setPlaying(false)
        }}
      >
        <motion.button
          type="button"
          aria-expanded={playing}
          initial={false}
          animate={{ x: playing ? 0 : 51 }}
          transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 180, damping: 24 }}
          className="relative z-10 aspect-square w-full rounded-xl bg-white p-1 shadow-sm ring-1 ring-black/5 outline-none focus-visible:ring-2 focus-visible:ring-red-500 sm:p-2"
          onClick={() => {
            setPlaying(true)
            setReplay(value => value + 1)
          }}
        >
          <QRCodeSVG value={link} size={224} marginSize={4} level="M" className="h-auto w-full" />
        </motion.button>

        <motion.div
          initial={false}
          animate={{ opacity: playing ? 1 : 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.3, delay: playing && !reduceMotion ? 0.15 : 0 }}
          aria-hidden={!playing}
          className="pointer-events-none relative h-44 min-w-0"
        >
          {playing && (
            <Image
              key={replay}
              src="/red-envelope-scan.svg"
              alt=""
              width={128}
              height={252}
              unoptimized
              className="absolute inset-0 h-full w-full"
            />
          )}
        </motion.div>
      </div>
    </>
  )
}
