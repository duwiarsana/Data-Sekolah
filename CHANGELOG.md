# Changelog

All notable changes to the Data Sekolah project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-05-19

### Added
- Initial release of the Data Sekolah web application
- Interactive map view with colored markers based on school values
- Admin dashboard for managing school data
- School data filtering by province, district, and education level
- Detailed README with project documentation and screenshots
- Color-coding system for visualizing school quality (0-10 scale)
- Form for adding and editing school data
- Pagination for navigating through school data in admin view

### Fixed
- School data editing functionality now properly loads existing data
- Province dropdown now populates correctly when editing a school
- Map zoom level adjusted to show more of Indonesia including Sumatra
- Field name mismatch between client and server resolved for proper data saving
- Validation requirements updated to make district field optional

### Changed
- Server configured to serve main index.html page instead of redirecting to admin.html
- Added "nilai" column to database with default value of 5 for existing records
- Improved error handling for API requests
- Enhanced form validation with clear error messages
- Updated UI with responsive design for various screen sizes

## [Unreleased]

### Planned Features
- User authentication and role-based access control
- Advanced search functionality
- Data export to CSV/Excel
- Statistical reports and visualizations
- Mobile app version
- Multi-language support
