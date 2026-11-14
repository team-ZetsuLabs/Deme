import { toCsv } from './csv'

describe('toCsv', () => {
  it('sépare par des points-virgules et protège les guillemets', () => {
    expect(toCsv(['nom', 'note'], [['Awa "Kane"', 3]])).toBe('nom;note\n"Awa ""Kane""";3')
  })

  it("neutralise l'injection de formules", () => {
    expect(toCsv(['a'], [['=HYPERLINK("x")'], ['+1'], ['@cmd']])).toBe(
      'a\n"\'=HYPERLINK(""x"")"\n\'+1\n\'@cmd',
    )
  })
})
