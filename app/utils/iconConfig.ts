export type IconMode = 'ascii' | 'svg'
export const iconMode: IconMode = (process.env.NEXT_PUBLIC_ICON_MODE === 'ascii' ? 'ascii' : 'svg')
