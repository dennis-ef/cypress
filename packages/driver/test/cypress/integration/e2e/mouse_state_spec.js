/// <reference path="@/../../../../../../../cli/types/index.d.ts"/>
const _ = Cypress._

// https://github.com/cypress-io/cypress/issues/2956
describe('mouse state', () => {

  describe('mouse/pointer events', () => {
    beforeEach(() => {
      cy.visit('http://localhost:3500/fixtures/dom.html')
    })
    describe.only('resets mouse state', () => {

      it('test 1', () => {
        cy.get('div.item:first').then(($el) => {
          cy.internal.mouse.moveMouseToCoords($el[0].getBoundingClientRect())
        })
      })
      
      it('test 2', () => {
        cy.get('body').addEventListener('mousemove', ()=>('mouse moved'))
        expect(cy.internal.mouse.mouseState).to.deep.eq({ x: 0, y: 0 })
      })
    })

    describe('mouseout', () => {
      it('can mouseout from div', () => {
        const spy = cy.spy((...args) => {
          console.log(args)
        })

        cy.get('div.item:first').should(($el) => {
          $el[0].addEventListener('mouseover', spy)
          cy.internal.mouse.moveMouseToCoords($el[0].getBoundingClientRect())
        }).then(() => {
          expect(spy).to.has.been.calledWithExactly({

          })
        })
      })

    })
  })

  describe('mouseleave mouseenter animations', () => {
    beforeEach(() => {
      cy.visit('http://localhost:3500/fixtures/issue-2956.html')
    })
    it('sends mouseenter/mouseleave event', () => {
      cy.get('#outer').click()
      cy.get('#inner').should('be.visible')
      cy.get('body').click()
      cy.get('#inner').should('not.be.visible')
    })
  })
})
