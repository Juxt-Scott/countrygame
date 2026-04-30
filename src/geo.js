const VIEWBOX_SIZE = 320
const PADDING = 22

function readPositions(geometry) {
  if (geometry.type === 'Polygon') {
    return geometry.coordinates.flat()
  }

  return geometry.coordinates.flat(2)
}

export function countryToSvgPath(geometry) {
  const points = readPositions(geometry)
  const longitudes = points.map(([longitude]) => longitude)
  const latitudes = points.map(([, latitude]) => latitude)
  const minLongitude = Math.min(...longitudes)
  const maxLongitude = Math.max(...longitudes)
  const minLatitude = Math.min(...latitudes)
  const maxLatitude = Math.max(...latitudes)
  const width = Math.max(maxLongitude - minLongitude, 0.01)
  const height = Math.max(maxLatitude - minLatitude, 0.01)
  const drawable = VIEWBOX_SIZE - PADDING * 2
  const scale = drawable / Math.max(width, height)
  const offsetX = (VIEWBOX_SIZE - width * scale) / 2
  const offsetY = (VIEWBOX_SIZE - height * scale) / 2

  const project = ([longitude, latitude]) => {
    const x = offsetX + (longitude - minLongitude) * scale
    const y = offsetY + (maxLatitude - latitude) * scale
    return `${x.toFixed(2)} ${y.toFixed(2)}`
  }

  const polygons =
    geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates

  return polygons
    .map((polygon) =>
      polygon
        .map((ring) => `M ${ring.map(project).join(' L ')} Z`)
        .join(' '),
    )
    .join(' ')
}

export { VIEWBOX_SIZE }
