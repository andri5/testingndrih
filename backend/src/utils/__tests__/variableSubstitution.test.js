import {
  substituteVariables,
  substituteStep,
  extractVariableNames
} from '../variableSubstitution.js'

describe('variableSubstitution', () => {
  const vars = { baseUrl: 'https://app.test', username: 'admin@test.com', password: 'secret' }

  it('substitutes {{key}} placeholders', () => {
    expect(substituteVariables('{{baseUrl}}/login', vars)).toBe('https://app.test/login')
    expect(substituteVariables('User: {{username}}', vars)).toBe('User: admin@test.com')
  })

  it('leaves unknown placeholders unchanged', () => {
    expect(substituteVariables('{{unknown}}/path', vars)).toBe('{{unknown}}/path')
  })

  it('substitutes step fields', () => {
    const step = {
      type: 'NAVIGATE',
      value: '{{baseUrl}}/dashboard',
      selector: '#user-{{username}}',
      description: 'Go to {{baseUrl}}'
    }
    const resolved = substituteStep(step, vars)
    expect(resolved.value).toBe('https://app.test/dashboard')
    expect(resolved.selector).toBe('#user-admin@test.com')
  })

  it('extracts variable names from text', () => {
    expect(extractVariableNames('{{baseUrl}}/api/{{version}}')).toEqual(['baseUrl', 'version'])
  })
})
