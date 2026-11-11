import type { Notification } from '../../api/types'
import { destinationOf } from './destination'

const make = (type: Notification['target']['type'], id = 7) =>
  ({ target: { type, id, title: 'x' } }) as Notification

test('une notification mène à la page de l’administration concernée', () => {
  expect(destinationOf(make('PLAYTEST'))).toBe('/tests/7')
  expect(destinationOf(make('PROJECT'))).toBe('/projets/7')
  expect(destinationOf(make('JOB'))).toBe('/offres')
  expect(destinationOf(make('CHALLENGE'))).toBe('/challenges')
  expect(destinationOf(make('COMMUNITY_PROPOSAL'))).toBe('/communautes')
})

test('une notification sans page associée ne mène nulle part', () => {
  expect(destinationOf(make('QUESTION'))).toBeNull()
  expect(destinationOf(make('USER'))).toBeNull()
})
