import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { FiCopy } from 'react-icons/fi';
import * as XLSX from 'xlsx';

const App = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingTotal, setFetchingTotal] = useState(false);
  const [addressCount, setAddressCount] = useState(10);
  const [selectedArea, setSelectedArea] = useState('90001');
  const [totalAvailableAddresses, setTotalAvailableAddresses] = useState(0);

  const fetchTotalAddresses = async (zipCode) => {
    setFetchingTotal(true);
    try {
      const response = await axios.get(
        `https://data.lacity.org/resource/4ca8-mxuh.json?$limit=10000&zip_cd=${zipCode}`
      );
      setTotalAvailableAddresses(response.data.length);
    } catch (error) {
      console.error('Error fetching total addresses:', error);
      setTotalAvailableAddresses(0);
    } finally {
      setFetchingTotal(false);
    }
  };

  const fetchAddresses = async () => {
    if (!/^\d{5}$/.test(selectedArea)) {
      alert('Please enter a valid 5-digit ZIP code.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `https://data.lacity.org/resource/4ca8-mxuh.json?$limit=${addressCount}&zip_cd=${selectedArea}`
      );

      const newAddresses = response.data.map((item) => ({
        address: `${item.hse_nbr || 'N/A'} ${item.hse_dir_cd || ''} ${item.str_nm || 'N/A'} ${item.str_sfx_cd || ''}`,
        city: 'Los Angeles',
        state: 'CA',
        zip: item.zip_cd || 'N/A',
        fullAddress: `${item.hse_nbr || ''} ${item.hse_dir_cd || ''} ${item.str_nm || ''} ${item.str_sfx_cd || ''} ${item.zip_cd || ''}`,
      }));

      setAddresses(newAddresses);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAreaChange = (event) => {
    const newArea = event.target.value;
    setSelectedArea(newArea);
    setAddresses([]); 
    if (/^\d{5}$/.test(newArea)) {
      fetchTotalAddresses(newArea); 
    } else {
      setTotalAvailableAddresses(0);
    }
  };

  const downloadCSV = () => {
    const csvContent = [
      ['Address', 'City', 'State', 'ZIP Code'],
      ...addresses.map((item) => [
        item.address,
        item.city,
        item.state,
        item.zip,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'addresses.csv');
  };

  const downloadExcel = () => {
    const data = addresses.map((item) => ({
      Address: item.address,
      City: item.city,
      State: item.state,
      ZipCode: item.zip,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Addresses');

    const excelFile = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelFile], { type: 'application/octet-stream' });
    saveAs(blob, 'addresses.xlsx');
  };

  const copyRowToClipboard = (rowContent) => {
    navigator.clipboard.writeText(rowContent).then(() => {
      alert('Row copied to clipboard!');
    });
  };

  useEffect(() => {
    fetchTotalAddresses(selectedArea); 
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-700 py-10 px-5">
      <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-lg p-8 sm:p-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-gray-800 mb-6 sm:mb-8">
          Los Angeles Address Generator
        </h1>
        <p className="text-center text-gray-600 mb-6 sm:mb-8 text-lg sm:text-xl">
          Generate a custom number of detailed addresses based on the entered ZIP code.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <input
              type="text"
              value={selectedArea}
              onChange={handleAreaChange}
              placeholder="Enter ZIP Code"
              className="w-full sm:w-40 px-4 py-2 border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            />
            <p className="text-lg font-semibold text-gray-800">
              Total Available Addresses:{' '}
              {fetchingTotal ? (
                <span className="text-blue-600">Loading...</span>
              ) : (
                totalAvailableAddresses
              )}
            </p>
          </div>

          <input
            type="number"
            min="1"
            value={addressCount}
            onChange={(e) => setAddressCount(e.target.value)}
            placeholder="Number of Addresses"
            className="w-full sm:w-40 px-4 py-2 border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            max={totalAvailableAddresses}
          />
          <button
            onClick={fetchAddresses}
            className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-full shadow-lg hover:bg-blue-700 transition duration-200 w-full sm:w-auto"
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Addresses'}
          </button>
        </div>

        {addresses.length > 0 && (
          <div className="text-center mb-6 sm:mb-8">
            <button
              onClick={downloadCSV}
              className="bg-green-600 text-white font-semibold py-3 px-6 rounded-full shadow-lg hover:bg-green-700 transition duration-200"
            >
              Download as CSV
            </button>
            <button
              onClick={downloadExcel}
              className="bg-orange-600 text-white font-semibold py-3 px-6 rounded-full shadow-lg hover:bg-orange-700 transition duration-200"
            >
              Download as Excel
            </button>
          </div>
        )}

        {addresses.length > 0 && (
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full table-auto border-collapse border border-gray-300 rounded-lg">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-4 py-4 text-left font-semibold text-sm sm:text-base">#</th>
                  <th className="border px-4 py-4 text-left font-semibold text-sm sm:text-base">Address</th>
                  <th className="border px-4 py-4 text-left font-semibold text-sm sm:text-base">City</th>
                  <th className="border px-4 py-4 text-left font-semibold text-sm sm:text-base">State</th>
                  <th className="border px-4 py-4 text-left font-semibold text-sm sm:text-base">ZIP Code</th>
                  <th className="border px-4 py-4 text-left font-semibold text-sm sm:text-base">Actions</th>
                </tr>
              </thead>
              <tbody>
                {addresses.map((item, index) => (
                  <tr key={index} className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition duration-200">
                    <td className="border px-4 py-4 text-center text-sm sm:text-base">{index + 1}</td>
                    <td className="border px-4 py-4 text-sm sm:text-base">{item.address}</td>
                    <td className="border px-4 py-4 text-sm sm:text-base">{item.city}</td>
                    <td className="border px-4 py-4 text-sm sm:text-base">{item.state}</td>
                    <td className="border px-4 py-4 text-sm sm:text-base">{item.zip}</td>
                    <td className="border px-4 py-4 text-center">
                      <button
                        onClick={() =>
                          copyRowToClipboard(
                            `${item.address} | ${item.city} | ${item.state} | ${item.zip}`
                          )
                        }
                        className="bg-yellow-500 text-white py-2 px-4 rounded-full shadow-lg hover:bg-yellow-600 transform hover:scale-105 transition duration-200"
                      >
                        <FiCopy className="text-lg sm:text-xl" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
