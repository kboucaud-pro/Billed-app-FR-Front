/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import userEvent from '@testing-library/user-event'

import router from "../app/Router.js";
import Bills from "../containers/Bills.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon).toBeTruthy();
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
    test("You must be able to vizualize the invoice on eye icon click", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      document.body.innerHTML = BillsUI({ data: [bills[0]] });
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const billsObject = new Bills({
        document, onNavigate, store: null, localStorage: window.localStorage
      });

      const firstIconEye = screen.getByTestId('icon-eye');
      const handleClickEye = jest.fn(billsObject.handleClickIconEye(firstIconEye));
      firstIconEye.addEventListener('click', handleClickEye);
      userEvent.click(firstIconEye);
      expect(handleClickEye).toHaveBeenCalled()

      const modaleFile = screen.getByTestId('bill-proof-container');
      expect(modaleFile).toBeTruthy();
    })
  })
  test("Bills data must be correctly formated", () => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee'
    }))
    document.body.innerHTML = BillsUI({ data: bills });
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname })
    }
    const billsObject = new Bills({
      document, onNavigate, store: mockStore, localStorage: window.localStorage
    });

    const formatedBills = billsObject.getBills();

    expect(formatedBills).toBeTruthy();
  })
})

describe("I am an employee who want to access my bills", () => {
  test("Fetch bills emplyee submitted", async () => {
    localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "e@e" }));
    const root = document.createElement("div");
    root.setAttribute('id', 'root');
    document.body.append(root);
    router();
    window.onNavigate(ROUTES_PATH.Bills);
    await waitFor(() => screen.getByText('Mes notes de frais'));
    const billsColumns = await screen.getByText('Montant');
    expect(billsColumns).toBeTruthy();
    const newBillButton = await screen.getAllByText('Nouvelle note de frais');
    expect(newBillButton).toBeTruthy();
  })
})

describe("When an error occurs on bills API", () => {
  beforeEach(() => {
    jest.spyOn(mockStore, 'bills');
    Object.defineProperty(
      window,
      'localStorage',
      { value: localStorageMock }
    )
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee',
      email: "e@e"
    }));
    const root = document.createElement("div");
    root.setAttribute('id', 'root');
    document.body.appendChild(root);
    router();
  })

  test("Fetch bills form API and get 404 Error", async () => {
    mockStore.bills.mockImplementationOnce(() => {
      return {
        list : () =>  {
          return Promise.reject(new Error("Erreur 404"))
        }
      }})
    window.onNavigate(ROUTES_PATH.Bills);
    await new Promise(process.nextTick);
    const message = await screen.getByText(/Erreur 404/);
    expect(message).toBeTruthy();
  })

  test("Fetch bills form API and get 500 Error", async () => {
    mockStore.bills.mockImplementationOnce(() => {
      return {
        list : () =>  {
          return Promise.reject(new Error("Erreur 500"))
        }
      }})
    window.onNavigate(ROUTES_PATH.Bills);
    await new Promise(process.nextTick);
    const message = await screen.getByText(/Erreur 500/);
    expect(message).toBeTruthy();
  })
})