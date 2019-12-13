module.exports = {
  locations: [
    {
      name: 'Library',
      roles: [
        'Janitor',
        'Security Guard',
        'Librarian'
      ]
    },
    {
      name: 'Hospital',
      roles: [
        'Doctor',
        'Doctor',
        'Nurse',
        'Nurse',
        'Nurse',
        'Patient',
      ]
    },
    {
      name: 'Supermarket',
      roles: [
        'Cashier',
        'Manager',
        'Bagger',
        'Butcher',
        'Shopper',
      ]
    }
  ],
  pickLocation: function () {
    const index = Math.floor(Math.random() * this.locations.length - 1) + 1;
    return this.locations[index];
  }
}
