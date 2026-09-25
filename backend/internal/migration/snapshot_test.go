package migration

import "testing"

func TestStripAutoIncrementOnlyRemovesTableOption(t *testing.T) {
	input := "CREATE TABLE `x` (`note` varchar(40) DEFAULT 'x AUTO_INCREMENT=77') ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4"
	want := "CREATE TABLE `x` (`note` varchar(40) DEFAULT 'x AUTO_INCREMENT=77') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
	if got := stripAutoIncrement(input); got != want {
		t.Fatalf("stripAutoIncrement() = %q, want %q", got, want)
	}
}
