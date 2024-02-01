/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import userEvent from "@testing-library/user-event"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import mockStore from "../__mocks__/store.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes"

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test('Then we can send the form with a file', async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      document.body.innerHTML = NewBillUI();

      let newBill = new NewBill({ document: document, onNavigate: onNavigate, store: mockStore, localStorage: window.localStorage });

      let submitButton = document.getElementById('btn-send-bill');
      const handleSubmit = jest.fn(() => newBill.handleSubmit);
      submitButton.addEventListener('submit', handleSubmit);

      newBill.fileName = 'test.png';

      screen.getByTestId('expense-type').value = 'Transports';
      screen.getByTestId('expense-name').value = 'test-title';
      screen.getByTestId('amount').value = 350;
      screen.getByTestId('datepicker').value = '2024-01-02';
      screen.getByTestId('vat').value = '1';
      screen.getByTestId('pct').value = 2;
      screen.getByTestId('commentary').value = 'test-commentary';

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(handleSubmit).not.toThrowError();
        expect(mockStore.bills().list()).toBeTruthy();
      })
    })
    test("Then we can have file information in real time if we update it", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      document.body.innerHTML = NewBillUI();

      let newBill = new NewBill({ document: document, onNavigate: onNavigate, store: mockStore, localStorage: window.localStorage });

      let uploadInput = screen.getByTestId('file');
      const handleChangeFile = jest.fn(() => newBill.handleChangeFile);

      uploadInput.addEventListener('change', handleChangeFile);
      userEvent.upload(uploadInput, new File(['test_file'], 'test.jpg', { type: 'image/jpg' }));

      await waitFor(() => {
        expect(newBill.fileName).toBe('test.jpg');
      })
    })
    test("Page must render correctly", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      document.body.innerHTML = NewBillUI();

      const newBillTitle = await screen.getByText('Envoyer une note de frais');
      const uploadLabel = await screen.getByText('Justificatif');

      expect(newBillTitle).toBeTruthy();
      expect(uploadLabel).toBeTruthy();
    })
  })
})
describe("When error occurs on API side", () => {
  test("Fetch bills form API and get 404 Error", async () => {
    const logSpy = jest.spyOn(console, 'error');

    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );

    document.body.innerHTML = NewBillUI();

    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };

    const store = {
      bills: () => {
        return {
          update: jest.fn(() => Promise.reject(new Error("404")))
        }
      }
    };

    const newBill = new NewBill({ document, onNavigate, store, localStorage });
    newBill.isImgFormatValid = true;
    newBill.fileName = "test.png";

    // Submit form
    const form = screen.getByTestId("form-new-bill");
    const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
    form.addEventListener("submit", handleSubmit);

    fireEvent.submit(form);
    await new Promise(process.nextTick);
    expect(logSpy).toHaveBeenCalledWith(new Error("404"));
  })
  test("Fetch bills form API and get 500 Error", async () => {
    const logSpy = jest.spyOn(console, 'error');

    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );

    document.body.innerHTML = NewBillUI();

    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };

    const store = {
      bills: () => {
        return {
          update: jest.fn(() => Promise.reject(new Error("500")))
        }
      }
    };

    const newBill = new NewBill({ document, onNavigate, store, localStorage });
    newBill.isImgFormatValid = true;
    newBill.fileName = "test.png";

    // Submit form
    const form = screen.getByTestId("form-new-bill");
    const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
    form.addEventListener("submit", handleSubmit);

    fireEvent.submit(form);
    await new Promise(process.nextTick);
    expect(logSpy).toHaveBeenCalledWith(new Error("500"));
  })
})
